"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Lock } from "lucide-react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@teamlet/ui";
import {
  createLeaveTypeAction,
  updateLeaveTypeAction,
  deleteLeaveTypeAction,
} from "@/lib/actions/leave-type";
import type { LeaveTypeFullItem } from "@teamlet/modules/leave";
import type {
  LeaveGrantMethod,
  LeaveGrantUnit,
  LeavePaymentType,
} from "@teamlet/db";

const GRANT_METHOD_LABEL: Record<LeaveGrantMethod, string> = {
  ON_REQUEST: "신청 시 차감",
  ON_OTHER_EXHAUSTED: "다른 휴가 소진 후",
  MANUAL: "수동 부여",
  ON_HIRE: "입사 시 자동 부여",
  PERIODIC: "주기적 부여",
  ON_TENURE: "근속 기준 부여",
};

const GRANT_UNIT_LABEL: Record<LeaveGrantUnit, string> = {
  DAY: "일",
  HOUR: "시간",
  MINUTE: "분",
  UNLIMITED: "무제한",
};

const PAYMENT_TYPE_LABEL: Record<LeavePaymentType, string> = {
  PAID: "유급",
  UNPAID: "무급",
  PARTIAL_PAID: "부분유급",
};

const PAYMENT_COLORS: Record<LeavePaymentType, string> = {
  PAID: "bg-green-50 text-green-700",
  UNPAID: "bg-slate-100 text-slate-600",
  PARTIAL_PAID: "bg-amber-50 text-amber-700",
};

type DialogMode = "create" | "edit";

function LeaveTypeDialog({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial?: LeaveTypeFullItem;
}) {
  const router = useRouter();
  const isEdit = !!initial;
  const isSystem = initial?.isSystem ?? false;

  const [name, setName] = useState(initial?.name ?? "");
  const [key, setKey] = useState(initial?.key ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [grantMethod, setGrantMethod] = useState<LeaveGrantMethod>(initial?.grantMethod ?? "ON_REQUEST");
  const [grantUnit, setGrantUnit] = useState<LeaveGrantUnit>(initial?.grantUnit ?? "DAY");
  const [grantAmount, setGrantAmount] = useState<string>(
    initial?.grantAmount != null ? String(initial.grantAmount) : "",
  );
  const [paymentType, setPaymentType] = useState<LeavePaymentType>(initial?.paymentType ?? "PAID");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function autoKey(v: string) {
    return v
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  }

  function handleNameChange(v: string) {
    setName(v);
    if (!isEdit) setKey(autoKey(v));
  }

  function handleSubmit() {
    if (!name.trim()) { setError("이름을 입력해 주세요"); return; }
    if (!isEdit && !key.trim()) { setError("key를 입력해 주세요"); return; }
    setError(null);
    const amount = grantUnit === "UNLIMITED" ? null : grantAmount ? parseFloat(grantAmount) : null;
    startTransition(async () => {
      const res = isEdit
        ? await updateLeaveTypeAction(initial!.id, {
            name,
            description,
            grantMethod,
            grantUnit,
            grantAmount: amount,
            paymentType,
            isActive,
          })
        : await createLeaveTypeAction({
            name,
            key,
            description,
            grantMethod,
            grantUnit,
            grantAmount: amount,
            paymentType,
          });
      if (res.ok) { onClose(); router.refresh(); }
      else setError(res.error.message);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isPending && !o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "휴가 종류 수정" : "휴가 종류 추가"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground-muted">이름</label>
            <input
              className="w-full rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-subtle"
              placeholder="예: 연차, 병가, 경조사"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground-muted">
              키 (key)
              {isSystem && <span className="ml-1 text-foreground-subtle">(법정 — 변경 불가)</span>}
            </label>
            <input
              className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-foreground-subtle disabled:opacity-60"
              placeholder="예: annual_leave"
              value={key}
              onChange={(e) => setKey(autoKey(e.target.value))}
              disabled={isPending || isEdit}
            />
            {!isEdit && (
              <p className="text-[10px] text-foreground-subtle">소문자·숫자·밑줄(_)만 사용. 생성 후 변경 불가.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground-muted">설명 <span className="text-foreground-subtle">(선택)</span></label>
            <input
              className="w-full rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-subtle"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground-muted">부여 방식</label>
              <select
                className="rounded-lg border border-border bg-background-primary px-2 py-2 text-sm text-foreground outline-none"
                value={grantMethod}
                onChange={(e) => setGrantMethod(e.target.value as LeaveGrantMethod)}
                disabled={isPending}
              >
                {(Object.keys(GRANT_METHOD_LABEL) as LeaveGrantMethod[]).map((v) => (
                  <option key={v} value={v}>{GRANT_METHOD_LABEL[v]}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground-muted">급여 유형</label>
              <select
                className="rounded-lg border border-border bg-background-primary px-2 py-2 text-sm text-foreground outline-none"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as LeavePaymentType)}
                disabled={isPending}
              >
                {(Object.keys(PAYMENT_TYPE_LABEL) as LeavePaymentType[]).map((v) => (
                  <option key={v} value={v}>{PAYMENT_TYPE_LABEL[v]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground-muted">단위</label>
              <select
                className="rounded-lg border border-border bg-background-primary px-2 py-2 text-sm text-foreground outline-none"
                value={grantUnit}
                onChange={(e) => setGrantUnit(e.target.value as LeaveGrantUnit)}
                disabled={isPending}
              >
                {(Object.keys(GRANT_UNIT_LABEL) as LeaveGrantUnit[]).map((v) => (
                  <option key={v} value={v}>{GRANT_UNIT_LABEL[v]}</option>
                ))}
              </select>
            </div>
            {grantUnit !== "UNLIMITED" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground-muted">기본 부여량 <span className="text-foreground-subtle">(선택)</span></label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  className="rounded-lg border border-border bg-background-primary px-2 py-2 text-sm text-foreground outline-none focus:border-foreground-subtle"
                  placeholder="예: 15"
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value)}
                  disabled={isPending}
                />
              </div>
            )}
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isPending}
                className="h-4 w-4 rounded border-border accent-foreground"
              />
              <span className="text-sm text-foreground">활성화</span>
            </label>
          )}

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

export function LeaveTypesClient({ types }: { types: LeaveTypeFullItem[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LeaveTypeFullItem | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(t: LeaveTypeFullItem) {
    if (t.isSystem) return;
    if (!confirm(`"${t.name}" 휴가 종류를 삭제할까요?`)) return;
    startTransition(async () => {
      const res = await deleteLeaveTypeAction(t.id);
      if (!res.ok) alert(res.error.message);
      else router.refresh();
    });
  }

  function handleToggleActive(t: LeaveTypeFullItem) {
    startTransition(async () => {
      await updateLeaveTypeAction(t.id, { isActive: !t.isActive });
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> 휴가 종류 추가
        </Button>
      </div>

      {types.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="text-sm font-medium text-foreground">등록된 휴가 종류가 없어요</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background-secondary">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-foreground-muted">이름</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-foreground-muted">key</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-foreground-muted">부여 방식</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-foreground-muted">급여</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-foreground-muted">상태</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-foreground-muted">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background-primary">
              {types.map((t) => (
                <tr key={t.id} className={t.isActive ? "" : "opacity-50"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {t.isSystem && (
                        <Lock className="h-3 w-3 shrink-0 text-foreground-subtle" />
                      )}
                      <span className="font-medium text-foreground">{t.name}</span>
                      {t.policyCount > 0 && (
                        <span className="rounded bg-background-secondary px-1 py-0.5 text-[10px] text-foreground-subtle">
                          정책 {t.policyCount}개
                        </span>
                      )}
                    </div>
                    {t.description && (
                      <p className="mt-0.5 text-xs text-foreground-subtle">{t.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-background-secondary px-1.5 py-0.5 text-xs text-foreground-muted">
                      {t.key}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground-muted">
                    {GRANT_METHOD_LABEL[t.grantMethod]}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-1.5 py-0.5 text-xs ${PAYMENT_COLORS[t.paymentType]}`}>
                      {PAYMENT_TYPE_LABEL[t.paymentType]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(t)}
                      disabled={isPending}
                      className={`rounded px-1.5 py-0.5 text-xs transition-colors ${
                        t.isActive
                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                          : "bg-background-secondary text-foreground-subtle hover:bg-background-secondary"
                      }`}
                    >
                      {t.isActive ? "활성" : "비활성"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditTarget(t)}
                        className="rounded-md p-1.5 text-foreground-subtle hover:bg-background-secondary hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        disabled={t.isSystem || isPending}
                        title={t.isSystem ? "법정 휴가는 삭제할 수 없어요" : "삭제"}
                        className="rounded-md p-1.5 text-foreground-subtle hover:bg-destructive-50 hover:text-destructive-600 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LeaveTypeDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      {editTarget && (
        <LeaveTypeDialog
          open
          onClose={() => setEditTarget(null)}
          initial={editTarget}
        />
      )}
    </>
  );
}
