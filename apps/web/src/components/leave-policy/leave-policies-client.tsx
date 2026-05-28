"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, Input } from "@teamlet/ui";
import type { LeavePolicyItem, LeaveTypeItem } from "@teamlet/modules/leave";
import {
  createLeavePolicyAction,
  updateLeavePolicyAction,
  deleteLeavePolicyAction,
} from "@/lib/actions/leave-policy";

const GRANT_MODE_LABEL = { FISCAL_YEAR: "회계연도 기준", HIRE_DATE: "입사일 기준" } as const;
const MONTHLY_GRANT_LABEL = {
  MONTHLY_ON_ATTENDANCE: "매월 개근 시 1일 부여",
  LUMP_SUM_ON_HIRE_11: "입사 후 11개월 치 일괄 부여",
  LUMP_SUM_UNTIL_FISCAL: "회계연도까지 월할 일괄 부여",
} as const;
const FIRST_YEAR_LABEL = {
  PRORATED_ON_FIRST_FISCAL: "첫 회계연도 월할 계산",
  DAYS_15_ON_FIRST_FISCAL: "첫 회계연도 15일",
  DAYS_15_ON_ANNIVERSARY: "1주년 15일",
  LUMP_SUM_ON_HIRE_15: "입사 시 15일 일괄",
} as const;
const DECIMAL_LABEL = {
  ROUND_UP_DAY: "일 단위 올림",
  ROUND_UP_HALF: "0.5일 단위 올림",
  NO_ADJUSTMENT: "그대로 유지",
} as const;

type Props = {
  initialPolicies: LeavePolicyItem[];
  leaveTypes: LeaveTypeItem[];
};

type FormState = {
  name: string;
  leaveTypeId: string;
  grantMode: "FISCAL_YEAR" | "HIRE_DATE";
  fiscalStartMonth: number;
  monthlyGrantRule: "MONTHLY_ON_ATTENDANCE" | "LUMP_SUM_ON_HIRE_11" | "LUMP_SUM_UNTIL_FISCAL";
  annualFirstYearRule: "PRORATED_ON_FIRST_FISCAL" | "DAYS_15_ON_FIRST_FISCAL" | "DAYS_15_ON_ANNIVERSARY" | "LUMP_SUM_ON_HIRE_15";
  decimalRule: "ROUND_UP_DAY" | "ROUND_UP_HALF" | "NO_ADJUSTMENT";
  expiryMonths: number;
  carryoverMaxDays: string;
  isDefault: boolean;
};

function defaultForm(leaveTypes: LeaveTypeItem[]): FormState {
  return {
    name: "",
    leaveTypeId: leaveTypes[0]?.id ?? "",
    grantMode: "FISCAL_YEAR",
    fiscalStartMonth: 1,
    monthlyGrantRule: "MONTHLY_ON_ATTENDANCE",
    annualFirstYearRule: "PRORATED_ON_FIRST_FISCAL",
    decimalRule: "ROUND_UP_DAY",
    expiryMonths: 12,
    carryoverMaxDays: "",
    isDefault: false,
  };
}

function policyToForm(p: LeavePolicyItem): FormState {
  return {
    name: p.name,
    leaveTypeId: p.leaveTypeId,
    grantMode: p.grantMode,
    fiscalStartMonth: p.fiscalStartMonth,
    monthlyGrantRule: p.monthlyGrantRule,
    annualFirstYearRule: p.annualFirstYearRule,
    decimalRule: p.decimalRule,
    expiryMonths: p.expiryMonths,
    carryoverMaxDays: p.carryoverMaxDays != null ? String(p.carryoverMaxDays) : "",
    isDefault: p.isDefault,
  };
}

function SelectField({ label, value, onChange, children }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-foreground-muted">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-md border border-border bg-background-primary px-3 text-sm text-foreground focus-visible:outline-none"
      >
        {children}
      </select>
    </div>
  );
}

function PolicyForm({ form, setForm, leaveTypes, disableLeaveType }: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  leaveTypes: LeaveTypeItem[];
  disableLeaveType?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-foreground-muted">정책명</label>
        <Input
          required
          minLength={1}
          maxLength={50}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="예: 표준 연차 정책"
        />
      </div>

      <SelectField label="휴가 유형" value={form.leaveTypeId} onChange={(v) => setForm((f) => ({ ...f, leaveTypeId: v }))}>
        {leaveTypes.map((t) => (
          <option key={t.id} value={t.id} disabled={disableLeaveType && t.id !== form.leaveTypeId}>
            {t.name}
          </option>
        ))}
      </SelectField>

      <div className="grid grid-cols-2 gap-3">
        <SelectField label="부여 기준" value={form.grantMode} onChange={(v) => setForm((f) => ({ ...f, grantMode: v as FormState["grantMode"] }))}>
          <option value="FISCAL_YEAR">회계연도 기준</option>
          <option value="HIRE_DATE">입사일 기준</option>
        </SelectField>
        {form.grantMode === "FISCAL_YEAR" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-foreground-muted">회계연도 시작 월</label>
            <Input
              type="number"
              min={1}
              max={12}
              value={form.fiscalStartMonth}
              onChange={(e) => setForm((f) => ({ ...f, fiscalStartMonth: Number(e.target.value) }))}
            />
          </div>
        )}
      </div>

      <SelectField label="1년차 월차 규칙" value={form.monthlyGrantRule} onChange={(v) => setForm((f) => ({ ...f, monthlyGrantRule: v as FormState["monthlyGrantRule"] }))}>
        <option value="MONTHLY_ON_ATTENDANCE">매월 개근 시 1일 부여</option>
        <option value="LUMP_SUM_ON_HIRE_11">입사 후 11개월 치 일괄 부여</option>
        <option value="LUMP_SUM_UNTIL_FISCAL">회계연도까지 월할 일괄 부여</option>
      </SelectField>

      <SelectField label="첫 연차 규칙" value={form.annualFirstYearRule} onChange={(v) => setForm((f) => ({ ...f, annualFirstYearRule: v as FormState["annualFirstYearRule"] }))}>
        <option value="PRORATED_ON_FIRST_FISCAL">첫 회계연도 월할 계산</option>
        <option value="DAYS_15_ON_FIRST_FISCAL">첫 회계연도 15일</option>
        <option value="DAYS_15_ON_ANNIVERSARY">1주년 시점 15일</option>
        <option value="LUMP_SUM_ON_HIRE_15">입사 시 15일 일괄</option>
      </SelectField>

      <div className="grid grid-cols-2 gap-3">
        <SelectField label="소수점 처리" value={form.decimalRule} onChange={(v) => setForm((f) => ({ ...f, decimalRule: v as FormState["decimalRule"] }))}>
          <option value="ROUND_UP_DAY">일 단위 올림</option>
          <option value="ROUND_UP_HALF">0.5일 단위 올림</option>
          <option value="NO_ADJUSTMENT">그대로 유지</option>
        </SelectField>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-foreground-muted">소멸 기한 (개월)</label>
          <Input
            type="number"
            min={1}
            max={60}
            value={form.expiryMonths}
            onChange={(e) => setForm((f) => ({ ...f, expiryMonths: Number(e.target.value) }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-foreground-muted">이월 최대 일수 (비워두면 제한 없음)</label>
        <Input
          type="number"
          min={0}
          placeholder="예: 10"
          value={form.carryoverMaxDays}
          onChange={(e) => setForm((f) => ({ ...f, carryoverMaxDays: e.target.value }))}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
          className="h-4 w-4 rounded border-border"
        />
        이 정책을 기본 정책으로 설정
      </label>
    </div>
  );
}

export function LeavePoliciesClient({ initialPolicies, leaveTypes }: Props) {
  const router = useRouter();
  const [policies, setPolicies] = useState(initialPolicies);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LeavePolicyItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeavePolicyItem | null>(null);
  const [form, setForm] = useState<FormState>(() => defaultForm(leaveTypes));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setForm(defaultForm(leaveTypes));
    setError(null);
    setCreateOpen(true);
  }

  function openEdit(p: LeavePolicyItem) {
    setForm(policyToForm(p));
    setError(null);
    setEditTarget(p);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createLeavePolicyAction({
        ...form,
        carryoverMaxDays: form.carryoverMaxDays !== "" ? Number(form.carryoverMaxDays) : null,
      });
      if (!res.ok) { setError(res.error.message); return; }
      setCreateOpen(false);
      router.refresh();
    });
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setError(null);
    startTransition(async () => {
      const res = await updateLeavePolicyAction(editTarget.id, {
        ...form,
        carryoverMaxDays: form.carryoverMaxDays !== "" ? Number(form.carryoverMaxDays) : null,
      });
      if (!res.ok) { setError(res.error.message); return; }
      setEditTarget(null);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteLeavePolicyAction(deleteTarget.id);
      if (!res.ok) { setError(res.error.message); return; }
      setPolicies((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>정책 추가</Button>
      </div>

      {policies.length === 0 ? (
        <div className="rounded-[14px] border border-border bg-background-primary p-10 text-center text-sm text-foreground-muted">
          등록된 휴가 정책이 없어요. 정책을 추가해 구성원에게 배정하세요.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {policies.map((p) => (
            <div
              key={p.id}
              className="rounded-[14px] border border-border bg-background-primary p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{p.name}</span>
                    {p.isDefault && (
                      <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700">기본</span>
                    )}
                    {!p.isActive && (
                      <span className="rounded-full bg-background-secondary px-2 py-0.5 text-xs text-foreground-muted">비활성</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-foreground-muted">{p.leaveTypeName}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-foreground-subtle">
                    <span>{GRANT_MODE_LABEL[p.grantMode]}</span>
                    <span>·</span>
                    <span>{MONTHLY_GRANT_LABEL[p.monthlyGrantRule]}</span>
                    <span>·</span>
                    <span>{FIRST_YEAR_LABEL[p.annualFirstYearRule]}</span>
                    <span>·</span>
                    <span>{DECIMAL_LABEL[p.decimalRule]}</span>
                    <span>·</span>
                    <span>소멸 {p.expiryMonths}개월</span>
                    {p.carryoverMaxDays != null && (
                      <>
                        <span>·</span>
                        <span>이월 최대 {p.carryoverMaxDays}일</span>
                      </>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-foreground-subtle">배정된 구성원 {p.assignedCount}명</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => openEdit(p)}>수정</Button>
                  <Button variant="destructive" onClick={() => { setError(null); setDeleteTarget(p); }}>삭제</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 추가 다이얼로그 */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!isPending) setCreateOpen(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>휴가 정책 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <PolicyForm form={form} setForm={setForm} leaveTypes={leaveTypes} />
            {error && (
              <p role="alert" className="rounded-[14px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">{error}</p>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isPending}>취소</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending || !form.name.trim() || !form.leaveTypeId}>
                {isPending ? "저장 중…" : "저장"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!isPending && !o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>휴가 정책 수정</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="flex flex-col gap-4">
            <PolicyForm form={form} setForm={setForm} leaveTypes={leaveTypes} disableLeaveType />
            {error && (
              <p role="alert" className="rounded-[14px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">{error}</p>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isPending}>취소</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending || !form.name.trim()}>
                {isPending ? "저장 중…" : "저장"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!isPending && !o) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정책 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground-muted">
            <strong className="text-foreground">{deleteTarget?.name}</strong> 정책을 삭제할까요?
            {deleteTarget && deleteTarget.assignedCount > 0 && (
              <span className="mt-1 block text-destructive">배정된 구성원이 있어 삭제할 수 없어요.</span>
            )}
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isPending}>취소</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={isPending || (deleteTarget?.assignedCount ?? 0) > 0}
              onClick={handleDelete}
            >
              {isPending ? "삭제 중…" : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
