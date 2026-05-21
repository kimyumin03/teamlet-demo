"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Button, Dialog, DialogClose, DialogContent,
  DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input,
} from "@teamlet/ui";
import type { EmployeeListItem } from "@teamlet/modules/employee";
import type { FormDocumentKind } from "@teamlet/modules/workflow";
import { createDocumentAction } from "@/lib/actions/workflow";

const KIND_OPTIONS: { value: FormDocumentKind; label: string }[] = [
  { value: "GENERAL", label: "일반" },
  { value: "LEAVE_REQUEST", label: "휴가" },
  { value: "INFO_CHANGE", label: "정보변경" },
  { value: "ANNOUNCEMENT", label: "공지" },
];

export function CreateDocumentButton({
  employees,
}: {
  employees: Pick<EmployeeListItem, "id" | "name">[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<FormDocumentKind>("GENERAL");
  const [approverIds, setApproverIds] = useState<string[]>([""]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setTitle("");
    setKind("GENERAL");
    setApproverIds([""]);
    setError(null);
  }

  function addApprover() {
    setApproverIds((prev) => [...prev, ""]);
  }

  function setApprover(idx: number, val: string) {
    setApproverIds((prev) => prev.map((id, i) => (i === idx ? val : id)));
  }

  function removeApprover(idx: number) {
    setApproverIds((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const valid = approverIds.filter(Boolean);
    if (valid.length === 0) { setError("결재자를 한 명 이상 선택해야 해요"); return; }
    startTransition(async () => {
      const res = await createDocumentAction({ title, kind, approverIds: valid });
      if (!res.ok) { setError(res.error.message); return; }
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (isPending) return; if (!o) reset(); setOpen(o); }}>
      <Button onClick={() => setOpen(true)}>+ 문서 작성</Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>결재 문서 작성</DialogTitle>
          <DialogDescription>제목과 결재자를 입력해 주세요.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-foreground-muted">제목</label>
            <Input required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-foreground-muted">종류</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as FormDocumentKind)}
              className="h-10 rounded-md border border-border bg-background-primary px-3 text-base text-foreground focus-visible:border-border-focus focus-visible:shadow-focus focus-visible:outline-none"
            >
              {KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-foreground-muted">결재선 (순서대로)</label>
            {approverIds.map((id, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-5 text-center text-xs text-foreground-subtle">{idx + 1}</span>
                <select
                  value={id}
                  onChange={(e) => setApprover(idx, e.target.value)}
                  className="flex-1 h-10 rounded-md border border-border bg-background-primary px-3 text-base text-foreground focus-visible:border-border-focus focus-visible:shadow-focus focus-visible:outline-none"
                >
                  <option value="">선택</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
                {approverIds.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeApprover(idx)}>×</Button>
                )}
              </div>
            ))}
            {approverIds.length < 5 && (
              <Button type="button" variant="secondary" size="sm" onClick={addApprover}>
                + 결재자 추가
              </Button>
            )}
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-destructive-50 px-3 py-2 text-sm text-destructive-700">{error}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isPending}>취소</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? "제출 중…" : "제출"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
