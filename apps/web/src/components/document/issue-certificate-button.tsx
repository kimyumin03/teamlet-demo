"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from "@teamlet/ui";
import { issueCertificateAction } from "@/lib/actions/document";
import type { CertificateType } from "@teamlet/db";

const TYPES: { value: CertificateType; label: string }[] = [
  { value: "EMPLOYMENT", label: "재직증명서" },
  { value: "CAREER", label: "경력증명서" },
];

export function IssueCertificateButton({
  employees,
  selfEmployeeId,
}: {
  employees: { id: string; name: string }[];
  selfEmployeeId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState(selfEmployeeId);
  const [type, setType] = useState<CertificateType>("EMPLOYMENT");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() { setEmployeeId(selfEmployeeId); setType("EMPLOYMENT"); setPurpose(""); setError(null); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await issueCertificateAction({ employeeId, type, purpose });
      if (!res.ok) { setError(res.error.message); return; }
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  const selectClass = "h-10 w-full rounded-[8px] border border-border bg-background-primary px-3 text-[13px] text-foreground focus-visible:border-border-focus focus-visible:outline-none";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (isPending) return; if (!o) reset(); setOpen(o); }}>
      <Button variant="secondary" onClick={() => setOpen(true)}>+ 발급 신청</Button>
      <DialogContent>
        <DialogHeader><DialogTitle>증명서 발급</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-foreground-muted">대상 직원</label>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={selectClass}>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}{emp.id === selfEmployeeId ? " (나)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-foreground-muted">증명서 종류</label>
            <select value={type} onChange={(e) => setType(e.target.value as CertificateType)} className={selectClass}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-foreground-muted">발급 목적</label>
            <Input required maxLength={100} placeholder="예: 금융기관 제출용" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>
          {error && <p role="alert" className="rounded-[14px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary" disabled={isPending}>취소</Button></DialogClose>
            <Button type="submit" disabled={isPending || !purpose.trim()}>
              {isPending ? "발급 중…" : "발급"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
