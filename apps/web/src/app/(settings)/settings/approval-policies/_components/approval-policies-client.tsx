"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@teamlet/ui";
import {
  createApprovalPolicyAction,
  updateApprovalPolicyAction,
  deleteApprovalPolicyAction,
} from "@/lib/actions/approval-policy";
import type { ApprovalPolicyItem, ApproverType } from "@teamlet/modules/workflow";

type Employee = { id: string; name: string; departmentName: string | null };

const APPROVER_TYPE_LABEL: Record<ApproverType, string> = {
  SPECIFIC_PERSON: "특정 인물",
  DIRECT_MANAGER: "직속 상관",
  DEPARTMENT_HEAD: "부서장",
  ORG_HEAD: "조직장",
};

const CATEGORY_OPTIONS = [
  { value: "GENERAL", label: "일반" },
  { value: "LEAVE_REQUEST", label: "휴가 신청" },
  { value: "INFO_CHANGE", label: "정보 변경" },
  { value: "ANNOUNCEMENT", label: "공지사항" },
] as const;

type StepDraft = { approverType: ApproverType; approverId: string };

function StepEditor({
  steps,
  employees,
  onChange,
  disabled,
}: {
  steps: StepDraft[];
  employees: Employee[];
  onChange: (steps: StepDraft[]) => void;
  disabled: boolean;
}) {
  function addStep() {
    onChange([...steps, { approverType: "SPECIFIC_PERSON", approverId: "" }]);
  }

  function removeStep(i: number) {
    onChange(steps.filter((_, idx) => idx !== i));
  }

  function update(i: number, patch: Partial<StepDraft>) {
    onChange(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  return (
    <div className="flex flex-col gap-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg border border-border p-2">
          <GripVertical className="h-4 w-4 shrink-0 text-foreground-subtle" />
          <span className="w-5 text-center text-xs text-foreground-subtle">{i + 1}</span>
          <select
            className="rounded border border-border bg-background-primary px-2 py-1 text-sm text-foreground outline-none"
            value={step.approverType}
            onChange={(e) => update(i, { approverType: e.target.value as ApproverType, approverId: "" })}
            disabled={disabled}
          >
            {Object.entries(APPROVER_TYPE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          {step.approverType === "SPECIFIC_PERSON" && (
            <select
              className="flex-1 rounded border border-border bg-background-primary px-2 py-1 text-sm text-foreground outline-none"
              value={step.approverId}
              onChange={(e) => update(i, { approverId: e.target.value })}
              disabled={disabled}
            >
              <option value="">구성원 선택</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}{e.departmentName ? ` (${e.departmentName})` : ""}
                </option>
              ))}
            </select>
          )}
          {step.approverType !== "SPECIFIC_PERSON" && (
            <span className="flex-1 text-xs text-foreground-subtle px-1">자동 결정</span>
          )}
          <button
            type="button"
            onClick={() => removeStep(i)}
            disabled={disabled}
            className="text-foreground-subtle hover:text-destructive-600 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addStep}
        disabled={disabled}
        className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" /> 단계 추가
      </button>
    </div>
  );
}

function PolicyDialog({
  open,
  onClose,
  employees,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  employees: Employee[];
  initial?: ApprovalPolicyItem;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<string>(initial?.category ?? "GENERAL");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [steps, setSteps] = useState<StepDraft[]>(
    initial?.steps.map((s) => ({
      approverType: s.approverType,
      approverId: s.approverId ?? "",
    })) ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEdit = !!initial;

  function handleSubmit() {
    if (!name.trim()) { setError("이름을 입력해 주세요"); return; }
    if (steps.length === 0) { setError("결재 단계를 하나 이상 추가해 주세요"); return; }
    const stepsPayload = steps.map((s) => ({
      approverType: s.approverType,
      ...(s.approverType === "SPECIFIC_PERSON" ? { approverId: s.approverId } : {}),
    }));
    setError(null);
    startTransition(async () => {
      const res = isEdit
        ? await updateApprovalPolicyAction(initial.id, { name, description, steps: stepsPayload })
        : await createApprovalPolicyAction({ name, category: category as "GENERAL", description, steps: stepsPayload });
      if (res.ok) { onClose(); router.refresh(); }
      else setError(res.error?.message ?? "오류가 발생했어요");
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isPending && !o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "결재 정책 수정" : "결재 정책 추가"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground-muted">정책 이름</label>
            <input
              className="w-full rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-subtle"
              placeholder="예: 휴가 신청 결재"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>
          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground-muted">적용 문서 종류</label>
              <select
                className="w-full rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-foreground outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isPending}
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground-muted">설명 <span className="text-foreground-subtle">(선택)</span></label>
            <input
              className="w-full rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-subtle"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground-muted">결재 단계</label>
            <StepEditor steps={steps} employees={employees} onChange={setSteps} disabled={isPending} />
          </div>
          {error && <p className="text-xs text-destructive-700">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="secondary" disabled={isPending} onClick={onClose}>취소</Button>
          <Button disabled={isPending} onClick={handleSubmit}>
            {isPending ? "저장 중…" : isEdit ? "저장" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ApprovalPoliciesClient({
  policies,
  employees,
  categoryLabel,
}: {
  policies: ApprovalPolicyItem[];
  employees: Employee[];
  categoryLabel: Record<string, string>;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApprovalPolicyItem | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("이 결재 정책을 삭제할까요?")) return;
    startTransition(async () => {
      await deleteApprovalPolicyAction(id);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> 정책 추가
        </Button>
      </div>

      {policies.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="text-sm font-medium text-foreground">등록된 결재 정책이 없어요</p>
          <p className="text-xs text-foreground-muted">정책을 추가하면 문서 기안 시 자동으로 결재선이 설정돼요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {policies.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-background-primary p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    <span className="rounded-md bg-background-secondary px-1.5 py-0.5 text-xs text-foreground-muted">
                      {categoryLabel[p.category] ?? p.category}
                    </span>
                    {!p.isActive && (
                      <span className="rounded-md bg-background-secondary px-1.5 py-0.5 text-xs text-foreground-subtle">
                        비활성
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="mt-0.5 text-xs text-foreground-muted">{p.description}</p>
                  )}
                  <ol className="mt-3 flex flex-wrap gap-2">
                    {p.steps.map((s) => (
                      <li key={s.step} className="flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background-secondary text-xs text-foreground-subtle">
                          {s.step}
                        </span>
                        <span className="text-xs text-foreground-muted">
                          {s.approverType === "SPECIFIC_PERSON"
                            ? (s.approverName ?? "미지정")
                            : APPROVER_TYPE_LABEL[s.approverType]}
                        </span>
                        {s.step < p.steps.length && (
                          <span className="text-xs text-foreground-subtle">→</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => setEditTarget(p)}
                    className="rounded-md p-1.5 text-foreground-subtle hover:bg-background-secondary hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={isPending}
                    className="rounded-md p-1.5 text-foreground-subtle hover:bg-destructive-50 hover:text-destructive-600 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PolicyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        employees={employees}
      />
      {editTarget && (
        <PolicyDialog
          open
          onClose={() => setEditTarget(null)}
          employees={employees}
          initial={editTarget}
        />
      )}
    </>
  );
}
