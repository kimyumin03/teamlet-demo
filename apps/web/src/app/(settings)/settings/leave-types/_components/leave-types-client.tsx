"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Lock, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@teamlet/ui";
import {
  createLeaveTypeAction,
  updateLeaveTypeAction,
  deleteLeaveTypeAction,
  bootstrapLeaveTypesAction,
} from "@/lib/actions/leave-type";
import type { LeaveTypeFullItem } from "@teamlet/modules/leave";
import { RecipientPickerRow, type PickerEmployee, type PickerDepartment } from "@/components/common/recipient-picker";
import { fromLegacy, toLegacy } from "@/components/common/recipient-picker-types";
import type {
  LeaveGrantMethod,
  LeaveGrantUnit,
  LeavePaymentType,
  LeaveGenderRestriction,
  LeaveEvidenceRequirement,
  LeaveUseUnit,
} from "@teamlet/db";

/* ── 레이블 맵 ─────────────────────────────────────── */
const GRANT_METHOD_LABEL: Record<LeaveGrantMethod, string> = {
  ON_REQUEST: "신청 시 부여",
  ON_OTHER_EXHAUSTED: "연차 소진 시 부여",
  MANUAL: "관리자가 직접 부여",
  ON_HIRE: "입사 시 부여",
  PERIODIC: "반복 부여",
  ON_TENURE: "근속 시 부여",
};

const GRANT_UNIT_LABEL: Record<LeaveGrantUnit, string> = {
  DAY: "일 단위 부여",
  HOUR: "시간 단위 부여",
  MINUTE: "분 단위 부여",
  UNLIMITED: "신청하는 만큼 부여",
};

const PAYMENT_LABEL: Record<LeavePaymentType, string> = {
  PAID: "유급",
  UNPAID: "무급",
  PARTIAL_PAID: "일부 유급",
};

const GENDER_LABEL: Record<LeaveGenderRestriction, string> = {
  ALL: "모두",
  MALE: "남성만",
  FEMALE: "여성만",
};

const EVIDENCE_LABEL: Record<LeaveEvidenceRequirement, string> = {
  NONE: "없음",
  BEFORE: "사전 제출",
  AFTER: "사후 제출",
};

const USE_UNIT_LABEL: Record<LeaveUseUnit, string> = {
  DAY: "나눠서 사용 (일)",
  HALF_DAY: "반차 단위",
  HOUR: "나눠서 사용 (시간)",
};

const EMPLOYMENT_TYPES = [
  { value: "REGULAR", label: "정규직" },
  { value: "CONTRACT", label: "계약직" },
  { value: "DISPATCH", label: "파견직" },
  { value: "DAILY", label: "일용직" },
  { value: "FREELANCE", label: "프리랜서" },
  { value: "REGISTERED_OFFICER", label: "등기 임원" },
  { value: "NON_REGISTERED_OFFICER", label: "비등기 임원" },
  { value: "COMMISSIONED", label: "위촉직" },
];

const PERIODIC_ANNUALLY_OPTS = [
  { value: "annually_from_hire", label: "입사 연도부터" },
  { value: "annually_from_2nd", label: "2년 차부터" },
  { value: "annually_from_3rd", label: "3년 차부터" },
  { value: "annually_from_4th", label: "4년 차부터" },
  { value: "annually_from_5th", label: "5년 차부터" },
];
const PERIODIC_MONTHLY_OPTS = [
  { value: "monthly_from_hire", label: "입사 월부터" },
  { value: "monthly_from_2nd", label: "2개월 차부터" },
  { value: "monthly_from_3rd", label: "3개월 차부터" },
  { value: "monthly_from_4th", label: "4개월 차부터" },
  { value: "monthly_from_5th", label: "5개월 차부터" },
  { value: "monthly_from_6th", label: "6개월 차부터" },
  { value: "monthly_from_7th", label: "7개월 차부터" },
  { value: "monthly_from_8th", label: "8개월 차부터" },
  { value: "monthly_from_9th", label: "9개월 차부터" },
  { value: "monthly_from_10th", label: "10개월 차부터" },
  { value: "monthly_from_11th", label: "11개월 차부터" },
];

// 시간차 사용 단위 (useUnit = HOUR). "" = 제한 없음
const HOUR_UNIT_OPTS = [
  { value: "", label: "제한 없음" },
  { value: "5", label: "5분" }, { value: "10", label: "10분" }, { value: "15", label: "15분" },
  { value: "20", label: "20분" }, { value: "30", label: "30분" },
  { value: "60", label: "1시간" }, { value: "120", label: "2시간" },
];

const SELECT_CLS = "rounded-lg border border-border bg-background-primary px-2 py-2 text-sm text-foreground outline-none focus:border-foreground-subtle";
const INPUT_CLS = "w-full rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-subtle";

/* ── 폼 상태 타입 ─────────────────────────────────── */
type FormState = {
  name: string;
  description: string;
  grantMethod: LeaveGrantMethod;
  grantUnit: LeaveGrantUnit;
  grantAmount: string;
  periodicType: "annually" | "monthly";
  periodicCycle: string;
  tenureYears: string;
  tenureHireDateBased: boolean;
  paymentType: LeavePaymentType;
  partialPayDays: string;
  useUnit: LeaveUseUnit;
  hourUnitMinutes: string;
  genderRestriction: LeaveGenderRestriction;
  evidenceRequirement: LeaveEvidenceRequirement;
  deductOnHoliday: boolean;
  excludedEmploymentTypes: string[];
  approverEmployeeId: string;
  ccEmployeeIds: string[];
  isActive: boolean;
};

function defaultForm(): FormState {
  return {
    name: "",
    description: "",
    grantMethod: "ON_REQUEST",
    grantUnit: "DAY",
    grantAmount: "1",
    periodicType: "monthly",
    periodicCycle: "monthly_from_hire",
    tenureYears: "1",
    tenureHireDateBased: false,
    paymentType: "PAID",
    partialPayDays: "",
    useUnit: "DAY",
    hourUnitMinutes: "",
    genderRestriction: "ALL",
    evidenceRequirement: "NONE",
    deductOnHoliday: false,
    excludedEmploymentTypes: [],
    approverEmployeeId: "",
    ccEmployeeIds: [],
    isActive: true,
  };
}

function typeToForm(t: LeaveTypeFullItem): FormState {
  return {
    name: t.name,
    description: t.description,
    grantMethod: t.grantMethod,
    grantUnit: t.grantUnit,
    grantAmount: t.grantAmount != null ? String(t.grantAmount) : "",
    periodicType: (t.periodicCycle ?? "monthly_from_hire").startsWith("annually") ? "annually" : "monthly",
    periodicCycle: t.periodicCycle ?? "monthly_from_hire",
    tenureYears: t.tenureYears != null ? String(t.tenureYears) : "1",
    tenureHireDateBased: false,
    paymentType: t.paymentType,
    partialPayDays: t.partialPayDays != null ? String(t.partialPayDays) : "",
    useUnit: t.useUnit,
    hourUnitMinutes: t.hourUnitMinutes != null ? String(t.hourUnitMinutes) : "",
    genderRestriction: t.genderRestriction,
    evidenceRequirement: t.evidenceRequirement,
    deductOnHoliday: t.deductOnHoliday,
    excludedEmploymentTypes: t.excludedEmploymentTypes,
    approverEmployeeId: t.approverEmployeeId ?? "",
    ccEmployeeIds: t.ccEmployeeIds ?? [],
    isActive: t.isActive,
  };
}

/* ── 섹션 라벨 ─────────────────────────────────────── */
function Field({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-foreground-muted">
        {label}
        {desc && <span className="ml-1 font-normal text-foreground-subtle">— {desc}</span>}
      </label>
      {children}
    </div>
  );
}

/* ── 메인 다이얼로그 ────────────────────────────────── */
function LeaveTypeDialog({
  open, onClose, initial, employees, departments,
}: {
  open: boolean;
  onClose: () => void;
  initial?: LeaveTypeFullItem;
  employees: PickerEmployee[];
  departments: PickerDepartment[];
}) {
  const router = useRouter();
  const isEdit = !!initial;
  const isSystem = initial?.isSystem ?? false;

  const [form, setForm] = useState<FormState>(() => initial ? typeToForm(initial) : defaultForm());
  const [key, setKey] = useState(initial?.key ?? "");
  const [extraOpen, setExtraOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setIsDirty(true);
  }

  function autoKey(v: string) {
    return v.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  }

  function handleClose() {
    if (isDirty) { setShowExitConfirm(true); return; }
    onClose();
  }

  // 부여 단위·시간 숨김 조건
  const hideGrantAmount = form.grantMethod === "MANUAL" || form.grantUnit === "UNLIMITED";
  const showPeriodicCycle = form.grantMethod === "PERIODIC";
  const showTenureYears = form.grantMethod === "ON_TENURE";

  function toggleExcluded(val: string) {
    set("excludedEmploymentTypes",
      form.excludedEmploymentTypes.includes(val)
        ? form.excludedEmploymentTypes.filter((v) => v !== val)
        : [...form.excludedEmploymentTypes, val]
    );
  }

  function handleSubmit() {
    if (!form.name.trim()) { setError("이름을 입력해 주세요"); return; }
    if (!isEdit && !key.trim()) { setError("key를 입력해 주세요"); return; }
    setError(null);

    const amount = hideGrantAmount ? null : form.grantAmount ? parseFloat(form.grantAmount) : null;
    const partialPay = form.paymentType === "PARTIAL_PAID" && form.partialPayDays
      ? parseInt(form.partialPayDays, 10) : null;
    const hourUnit = form.useUnit === "HOUR" && form.hourUnitMinutes
      ? parseInt(form.hourUnitMinutes, 10) : null;

    startTransition(async () => {
      const res = isEdit
        ? await updateLeaveTypeAction(initial!.id, {
            name: form.name, description: form.description,
            grantMethod: form.grantMethod, grantUnit: form.grantUnit,
            grantAmount: amount, paymentType: form.paymentType,
            partialPayDays: partialPay,
            genderRestriction: form.genderRestriction,
            evidenceRequirement: form.evidenceRequirement,
            useUnit: form.useUnit,
            hourUnitMinutes: hourUnit,
            deductOnHoliday: form.deductOnHoliday,
            periodicCycle: showPeriodicCycle ? form.periodicCycle : null,
            tenureYears: showTenureYears ? parseInt(form.tenureYears, 10) : null,
            excludedEmploymentTypes: form.excludedEmploymentTypes,
            approverEmployeeId: form.approverEmployeeId || null,
            ccEmployeeIds: form.ccEmployeeIds,
            isActive: form.isActive,
          })
        : await createLeaveTypeAction({
            name: form.name, key, description: form.description,
            grantMethod: form.grantMethod, grantUnit: form.grantUnit,
            grantAmount: amount, paymentType: form.paymentType,
            partialPayDays: partialPay,
            genderRestriction: form.genderRestriction,
            evidenceRequirement: form.evidenceRequirement,
            useUnit: form.useUnit,
            hourUnitMinutes: hourUnit,
            deductOnHoliday: form.deductOnHoliday,
            periodicCycle: showPeriodicCycle ? form.periodicCycle : null,
            tenureYears: showTenureYears ? parseInt(form.tenureYears, 10) : null,
            excludedEmploymentTypes: form.excludedEmploymentTypes,
            approverEmployeeId: form.approverEmployeeId || null,
            ccEmployeeIds: form.ccEmployeeIds,
          });


      if (res.ok) { onClose(); router.refresh(); }
      else setError(res.error.message);
    });
  }


  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!isPending && !o) handleClose(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? `${initial!.name} 수정` : "맞춤 휴가 추가"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-1 max-h-[72vh] overflow-y-auto pr-1">
            {/* 이름 + key */}
            <Field label="이름">
              <input className={INPUT_CLS} placeholder="예: 병가, 경조사" value={form.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!isEdit) setKey(autoKey(e.target.value));
                }} disabled={isPending} />
            </Field>

            {!isEdit && (
              <Field label="키 (key)" desc="소문자·숫자·밑줄만, 생성 후 변경 불가">
                <input className={`${INPUT_CLS} font-mono opacity-80`}
                  value={key} onChange={(e) => setKey(autoKey(e.target.value))} disabled={isPending} />
              </Field>
            )}

            <Field label="설명" desc="선택">
              <input className={INPUT_CLS} value={form.description}
                onChange={(e) => set("description", e.target.value)} disabled={isPending} />
            </Field>

            <div style={{ borderTop: "1px solid var(--border)", margin: "0 -2px" }} />

            {/* 부여 방법 */}
            <div>
              <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: "var(--fg-muted)" }}>
                부여 방법 <span style={{ fontWeight: 400, color: "var(--fg-subtle)" }}>— 휴가의 성격에 따라 선택해요.</span>
              </div>
              <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", letterSpacing: "0.04em" }}>조건에 따라 부여</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {(["ON_REQUEST", "ON_OTHER_EXHAUSTED", "MANUAL", "ON_HIRE"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => set("grantMethod", m)}
                    style={{
                      padding: "5px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                      border: `1.5px solid ${form.grantMethod === m ? "var(--primary)" : "var(--border)"}`,
                      background: form.grantMethod === m ? "var(--primary-soft)" : "var(--bg-primary)",
                      color: form.grantMethod === m ? "var(--primary)" : "var(--fg-muted)", cursor: "pointer",
                    }}>
                    {GRANT_METHOD_LABEL[m]}
                  </button>
                ))}
              </div>
              <div style={{ marginBottom: 6, fontSize: 11, fontWeight: 600, color: "var(--fg-subtle)", letterSpacing: "0.04em" }}>주기 단위로 부여</div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["PERIODIC", "ON_TENURE"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => set("grantMethod", m)}
                    style={{
                      padding: "5px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                      border: `1.5px solid ${form.grantMethod === m ? "var(--primary)" : "var(--border)"}`,
                      background: form.grantMethod === m ? "var(--primary-soft)" : "var(--bg-primary)",
                      color: form.grantMethod === m ? "var(--primary)" : "var(--fg-muted)", cursor: "pointer",
                    }}>
                    {GRANT_METHOD_LABEL[m]}
                  </button>
                ))}
              </div>
            </div>

            {/* 반복 주기 (PERIODIC) — 2단 선택: 매년/매월 → 세부 시점 */}
            {showPeriodicCycle && (
              <div className="flex flex-col gap-2">
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)" }}>
                  반복 주기 <span style={{ fontWeight: 400, color: "var(--fg-subtle)" }}>— 어떤 주기로 부여할지 설정해요.</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["annually", "monthly"] as const).map((type) => (
                    <button key={type} type="button"
                      onClick={() => {
                        const next = type === "annually" ? "annually_from_hire" : "monthly_from_hire";
                        setForm((f) => ({ ...f, periodicType: type, periodicCycle: next }));
                        setIsDirty(true);
                      }}
                      style={{
                        padding: "5px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                        border: `1.5px solid ${form.periodicType === type ? "var(--primary)" : "var(--border)"}`,
                        background: form.periodicType === type ? "var(--primary-soft)" : "var(--bg-primary)",
                        color: form.periodicType === type ? "var(--primary)" : "var(--fg-muted)",
                      }}>
                      {type === "annually" ? "매년 부여" : "매월 부여"}
                    </button>
                  ))}
                </div>
                <select className={SELECT_CLS}
                  value={form.periodicCycle}
                  onChange={(e) => set("periodicCycle", e.target.value)}>
                  {(form.periodicType === "annually" ? PERIODIC_ANNUALLY_OPTS : PERIODIC_MONTHLY_OPTS).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <p style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>
                  {form.periodicType === "annually"
                    ? "선택한 시점부터 매년 1월 1일에 휴가가 부여되고, 사용하지 않은 휴가는 12월 31일에 소멸돼요."
                    : "선택한 시점부터 매월 1일에 휴가가 부여되고, 사용하지 않은 휴가는 말일에 소멸돼요."}
                </p>
              </div>
            )}

            {/* 근속 시점 (ON_TENURE) */}
            {showTenureYears && (
              <div className="flex flex-col gap-2">
                <Field label="부여 시점" desc="휴가를 부여할 근속 시점을 선택해주세요.">
                  <select className={SELECT_CLS} value={form.tenureYears} onChange={(e) => set("tenureYears", e.target.value)}>
                    {[1,2,3,4,5,6,7,8,9,10].map((y) => (
                      <option key={y} value={String(y)}>{y}년 근속 시</option>
                    ))}
                  </select>
                </Field>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 2 }}>
                  <div
                    onClick={() => set("tenureHireDateBased", !form.tenureHireDateBased)}
                    style={{
                      width: 34, height: 19, borderRadius: 999, padding: 2, cursor: "pointer",
                      background: form.tenureHireDateBased ? "var(--primary)" : "var(--border)",
                      display: "flex", alignItems: "center", transition: "background 0.2s",
                    }}>
                    <div style={{
                      width: 15, height: 15, borderRadius: "50%", background: "white",
                      transform: form.tenureHireDateBased ? "translateX(15px)" : "translateX(0)",
                      transition: "transform 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                    }} />
                  </div>
                  <span style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>입사일 기준</span>
                </label>
              </div>
            )}

            {/* 부여 단위 + 부여량 (MANUAL 제외) */}
            {form.grantMethod !== "MANUAL" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="부여 단위">
                  <select className={SELECT_CLS} value={form.grantUnit} onChange={(e) => set("grantUnit", e.target.value as LeaveGrantUnit)}>
                    {(Object.keys(GRANT_UNIT_LABEL) as LeaveGrantUnit[]).map((v) => (
                      <option key={v} value={v}>{GRANT_UNIT_LABEL[v]}</option>
                    ))}
                  </select>
                </Field>
                {!hideGrantAmount && (
                  <Field label="부여 시간" desc="얼마나 부여할지">
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input type="number" min={0} step={0.5} className={INPUT_CLS}
                        placeholder="1" value={form.grantAmount}
                        onChange={(e) => set("grantAmount", e.target.value)} />
                      <span style={{ fontSize: 12, color: "var(--fg-muted)", whiteSpace: "nowrap" }}>
                        {form.grantUnit === "DAY" ? "일" : form.grantUnit === "HOUR" ? "시간" : "분"}
                      </span>
                    </div>
                  </Field>
                )}
              </div>
            )}
            {form.grantUnit === "UNLIMITED" && (
              <p style={{ fontSize: 12, color: "var(--warning, #d97706)" }}>
                신청하는 만큼 부여됩니다. 부여량에 제약이 없으니 신중하게 선택해주세요.
              </p>
            )}

            {/* 사용 단위 */}
            <Field label="사용 단위" desc="최소 사용 단위를 지정해요.">
              <select className={SELECT_CLS} value={form.useUnit}
                onChange={(e) => set("useUnit", e.target.value as LeaveUseUnit)}>
                {(Object.keys(USE_UNIT_LABEL) as LeaveUseUnit[]).map((v) => (
                  <option key={v} value={v}>{USE_UNIT_LABEL[v]}</option>
                ))}
              </select>
              {form.useUnit === "HOUR" && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginBottom: 4 }}>시간차 사용 단위</div>
                  <select className={SELECT_CLS} style={{ width: "100%" }}
                    value={form.hourUnitMinutes}
                    onChange={(e) => set("hourUnitMinutes", e.target.value)}>
                    {HOUR_UNIT_OPTS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 4 }}>
                    시간차로 신청할 때 선택할 수 있는 최소 단위예요.
                  </p>
                </div>
              )}
            </Field>

            {/* 급여 지급 유무 */}
            <Field label="급여 지급 유무" desc="이 휴가의 급여 기준을 선택해요.">
              <select className={SELECT_CLS} value={form.paymentType}
                onChange={(e) => set("paymentType", e.target.value as LeavePaymentType)}>
                {(Object.keys(PAYMENT_LABEL) as LeavePaymentType[]).map((v) => (
                  <option key={v} value={v}>{PAYMENT_LABEL[v]}</option>
                ))}
              </select>
              {form.paymentType === "PARTIAL_PAID" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>며칠을 유급으로 인정할까요?</span>
                  <input type="number" min={0} className={INPUT_CLS} style={{ width: 80 }}
                    placeholder="0" value={form.partialPayDays}
                    onChange={(e) => set("partialPayDays", e.target.value)} />
                  <span style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>일</span>
                </div>
              )}
            </Field>

            {/* 승인·참조 사용 — 공통 피커(RecipientPicker). 여기서 지정 → 이 휴가 신청 시 고정 적용 */}
            <Field label="승인·참조 사용" desc="여기서 지정하면 이 휴가 신청 시 고정 적용돼요.">
              <RecipientPickerRow
                value={fromLegacy(form.approverEmployeeId || null, form.ccEmployeeIds)}
                onChange={(v) => {
                  const l = toLegacy(v);
                  setForm((f) => ({ ...f, approverEmployeeId: l.approverEmployeeId ?? "", ccEmployeeIds: l.ccEmployeeIds }));
                }}
                employees={employees}
                departments={departments}
                label="승인 · 참조자 선택"
                description="휴가에 승인 · 참조 대상을 설정할 수 있어요."
              />
            </Field>

            {/* 추가 설정 (접이식) */}
            <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              <button type="button" onClick={() => setExtraOpen((p) => !p)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", background: "var(--bg-secondary)", border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, color: "var(--fg)",
                }}>
                <span>추가 설정</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--fg-muted)", fontWeight: 400 }}>
                  사용 가능 성별 · 증명 자료 · 휴가 차감 설정
                  {extraOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </button>

              {extraOpen && (
                <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* 성별 */}
                  <Field label="사용 가능 성별" desc="선택한 성별의 구성원에게만 휴가가 보여져요.">
                    <select className={SELECT_CLS} value={form.genderRestriction}
                      onChange={(e) => set("genderRestriction", e.target.value as LeaveGenderRestriction)}>
                      {(Object.keys(GENDER_LABEL) as LeaveGenderRestriction[]).map((v) => (
                        <option key={v} value={v}>{GENDER_LABEL[v]}</option>
                      ))}
                    </select>
                  </Field>

                  {/* 증명 자료 */}
                  <Field label="증명 자료 제출" desc="휴가 사용 전/후에 증명자료를 받을 수 있어요.">
                    <select className={SELECT_CLS} value={form.evidenceRequirement}
                      onChange={(e) => set("evidenceRequirement", e.target.value as LeaveEvidenceRequirement)}>
                      {(Object.keys(EVIDENCE_LABEL) as LeaveEvidenceRequirement[]).map((v) => (
                        <option key={v} value={v}>{EVIDENCE_LABEL[v]}</option>
                      ))}
                    </select>
                  </Field>

                  {/* 제외 대상 */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 6 }}>
                      제외 대상 설정 <span style={{ fontWeight: 400, color: "var(--fg-subtle)" }}>— 선택한 유형에는 휴가가 부여되지 않아요.</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {EMPLOYMENT_TYPES.map(({ value, label }) => {
                        const checked = form.excludedEmploymentTypes.includes(value);
                        return (
                          <button key={value} type="button" onClick={() => toggleExcluded(value)}
                            style={{
                              padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
                              border: `1.5px solid ${checked ? "var(--destructive)" : "var(--border)"}`,
                              background: checked ? "var(--destructive-soft, #fef2f2)" : "var(--bg-primary)",
                              color: checked ? "var(--destructive)" : "var(--fg-muted)",
                            }}>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {form.excludedEmploymentTypes.length > 0 && (
                      <p style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 6 }}>
                        구성원 정보 변경에 따라 제외 대상이 달라질 수 있어요.
                      </p>
                    )}
                  </div>

                  {/* 휴일 차감 */}
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <div
                      onClick={() => set("deductOnHoliday", !form.deductOnHoliday)}
                      style={{
                        width: 40, height: 22, borderRadius: 999, padding: 2, cursor: "pointer",
                        background: form.deductOnHoliday ? "var(--primary)" : "var(--border)",
                        display: "flex", alignItems: "center", transition: "background 0.2s",
                      }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%", background: "white",
                        transform: form.deductOnHoliday ? "translateX(18px)" : "translateX(0)",
                        transition: "transform 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>휴일에 등록된 휴가 차감</div>
                      <div style={{ fontSize: 11.5, color: "var(--fg-muted)" }}>
                        휴가 기간에 휴일이 포함된 경우, 휴일에 등록된 휴가도 수량에서 차감돼요.
                      </div>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* 활성화 (수정 시) */}
            {isEdit && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={form.isActive}
                  onChange={(e) => set("isActive", e.target.checked)}
                  className="h-4 w-4 rounded border-border" />
                <span className="text-sm text-foreground">활성화</span>
                {!form.isActive && <span style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>비활성 시 구성원 신청 목록에서 숨겨져요.</span>}
              </label>
            )}

            {error && <p style={{ fontSize: 12.5, color: "var(--destructive)" }}>{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="secondary" disabled={isPending} onClick={handleClose}>취소</Button>
            <Button disabled={isPending} onClick={handleSubmit}>
              {isPending ? "저장 중…" : isEdit ? "저장" : "만들기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 이탈 확인 모달 */}
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>변경사항을 저장하지 않고 나가시겠어요?</DialogTitle></DialogHeader>
          <p className="text-sm text-foreground-muted">작성한 내용이 저장되지 않아요.</p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowExitConfirm(false)}>이어서 진행하기</Button>
            <Button variant="destructive" onClick={() => { setShowExitConfirm(false); onClose(); }}>나가기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ── 목록 클라이언트 ────────────────────────────────── */
export function LeaveTypesClient({
  types, employees, departments,
}: {
  types: LeaveTypeFullItem[];
  employees: PickerEmployee[];
  departments: PickerDepartment[];
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LeaveTypeFullItem | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(t: LeaveTypeFullItem) {
    if (t.isSystem || t.isRequired) return;
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

  const [statBootstrapping, setStatBootstrapping] = useState(false);
  function handleBootstrapStatutory() {
    if (!confirm("법정의무휴가(연차·출산전후·배우자출산·난임·가족돌봄 등)를 일괄 등록할까요? 이미 등록된 휴가는 건너뜁니다.")) return;
    setStatBootstrapping(true);
    startTransition(async () => {
      const res = await bootstrapLeaveTypesAction();
      setStatBootstrapping(false);
      if (res.ok) router.refresh();
      else alert(res.error ?? "법정의무휴가 등록에 실패했어요");
    });
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-foreground">휴가 종류</h3>
          <p className="mt-0.5 text-[12.5px] text-foreground-muted">법정 종류는 삭제할 수 없어요. 비활성화만 가능합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleBootstrapStatutory} disabled={statBootstrapping || isPending}>
            {statBootstrapping ? "등록 중…" : "법정의무휴가 추가"}
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> 맞춤 휴가 추가
          </Button>
        </div>
      </div>

      {types.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="text-sm font-medium text-foreground">등록된 휴가 종류가 없어요</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border">
          {types.map((t) => (
            <div key={t.id} className={`flex items-center gap-3 bg-background-primary px-4 py-3 transition-colors hover:bg-background-secondary/40 ${!t.isActive ? "opacity-50" : ""}`}>
              <GripVertical className="h-4 w-4 shrink-0 text-foreground-subtle" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {t.isSystem && <Lock className="h-3 w-3 shrink-0 text-foreground-subtle" />}
                  <span className="font-medium text-foreground text-sm">{t.name}</span>
                  {t.isRequired && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">필수</span>}
                  {!t.isActive && <span className="rounded bg-background-secondary px-1.5 py-0.5 text-[10px] text-foreground-subtle">비활성</span>}
                </div>
                {t.description && <p className="mt-0.5 text-xs text-foreground-subtle truncate">{t.description}</p>}
              </div>
              {/* 승인/참조 뱃지 */}
              <div className="flex items-center gap-1.5 shrink-0">
                {t.approverEmployeeId ? (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] text-foreground-muted">1단계 승인</span>
                ) : (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] text-foreground-subtle">승인 없음</span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setEditTarget(t)}
                  className="rounded-md p-1.5 text-foreground-subtle hover:bg-background-secondary hover:text-foreground transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(t)} disabled={t.isSystem || t.isRequired || isPending}
                  title={t.isSystem || t.isRequired ? "법정 필수 휴가는 삭제할 수 없어요" : "삭제"}
                  className="rounded-md p-1.5 text-foreground-subtle hover:bg-destructive-50 hover:text-destructive-600 transition-colors disabled:cursor-not-allowed disabled:opacity-30">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <LeaveTypeDialog open={createOpen} onClose={() => setCreateOpen(false)} employees={employees} departments={departments} />
      {editTarget && (
        <LeaveTypeDialog open onClose={() => setEditTarget(null)} initial={editTarget} employees={employees} departments={departments} />
      )}
    </>
  );
}
