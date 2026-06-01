"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, Input } from "@teamlet/ui";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { LeavePolicyItem } from "@teamlet/modules/leave";
import {
  createLeavePolicyAction,
  updateLeavePolicyAction,
  deleteLeavePolicyAction,
} from "@/lib/actions/leave-policy";
import { bootstrapLeaveTypesAction } from "@/lib/actions/leave-type";
import type {
  LeavePolicyGrantMode,
  MonthlyGrantRule,
  AnnualFirstYearRule,
  DecimalRule,
  LeaveUseUnit,
  MonthlyExpiryMode,
  AnnualExpiryMode,
} from "@teamlet/db";

/* ── 레이블 맵 ─────────────────────────── */
const GRANT_MODE_LABEL: Record<LeavePolicyGrantMode, string> = {
  FISCAL_YEAR: "회계연도 기준",
  HIRE_DATE: "입사일 기준",
};
const USE_UNIT_LABEL: Record<LeaveUseUnit, string> = {
  HOUR: "시간",
  HALF_DAY: "반차",
  DAY: "일",
};
const MONTHLY_EXPIRY_LABEL: Record<MonthlyExpiryMode, string> = {
  NONE: "소멸 안 함",
  HIRE_DATE_1Y: "입사일로부터 1년 후",
  HIRE_DATE_1Y_FISCAL: "입사일로부터 1년 후 첫 회계일",
};
const ANNUAL_EXPIRY_LABEL: Record<AnnualExpiryMode, string> = {
  NONE: "소멸 안 함",
  GRANT_DATE_1Y: "부여일로부터 1년 후",
};
const HOUR_UNIT_OPTIONS = [
  { value: 1, label: "1분" }, { value: 5, label: "5분" }, { value: 10, label: "10분" },
  { value: 15, label: "15분" }, { value: 20, label: "20분" }, { value: 30, label: "30분 (추천)" },
  { value: 60, label: "1시간" }, { value: 120, label: "2시간" },
];
const GRACE_MONTH_OPTIONS = [
  { value: "", label: "유예기간 없음" },
  { value: "19", label: "19개월" }, { value: "20", label: "20개월" },
  { value: "21", label: "21개월" }, { value: "22", label: "22개월" },
  { value: "23", label: "23개월" }, { value: "24", label: "24개월" },
];

const SELECT_CLS = "h-9 w-full rounded-lg border border-border bg-background-primary px-3 text-sm text-foreground outline-none focus:border-foreground-subtle";
const INPUT_CLS = "h-9 w-full rounded-lg border border-border bg-background-primary px-3 text-sm text-foreground outline-none focus:border-foreground-subtle";

type Employee = { id: string; name: string };

type Props = {
  initialPolicies: LeavePolicyItem[];
  annualTypeId: string;
  employees: Employee[];
};

type FormState = {
  name: string;
  // 부여 기준
  grantMode: LeavePolicyGrantMode;
  fiscalStartMonth: number;
  monthlyGrantRule: MonthlyGrantRule;
  annualFirstYearRule: AnnualFirstYearRule;
  decimalRule: DecimalRule;
  // 소멸/이월
  expiryMonths: number;
  carryoverMaxDays: string;
  monthlyExpiryMode: MonthlyExpiryMode;
  monthlyGraceMonths: string;
  annualExpiryMode: AnnualExpiryMode;
  annualGraceMonths: string;
  // 사용 단위
  useUnit: LeaveUseUnit;
  hourUnitMinutes: string;
  // 당겨쓰기
  overdraftEnabled: boolean;
  overdraftMaxDays: string;
  // 승인선
  approverEmployeeId: string;
  ccEmployeeIds: string[];
  approveOnRegister: boolean;
  approveOnCancel: boolean;
  // 촉진
  smartPromotionEnabled: boolean;
  isDefault: boolean;
};

function defaultForm(): FormState {
  return {
    name: "",
    grantMode: "FISCAL_YEAR",
    fiscalStartMonth: 1,
    monthlyGrantRule: "MONTHLY_ON_ATTENDANCE",
    annualFirstYearRule: "PRORATED_ON_FIRST_FISCAL",
    decimalRule: "ROUND_UP_DAY",
    expiryMonths: 12,
    carryoverMaxDays: "",
    monthlyExpiryMode: "HIRE_DATE_1Y",
    monthlyGraceMonths: "",
    annualExpiryMode: "GRANT_DATE_1Y",
    annualGraceMonths: "",
    useUnit: "HALF_DAY",
    hourUnitMinutes: "30",
    overdraftEnabled: false,
    overdraftMaxDays: "",
    approverEmployeeId: "",
    ccEmployeeIds: [],
    approveOnRegister: true,
    approveOnCancel: false,
    smartPromotionEnabled: false,
    isDefault: false,
  };
}

function policyToForm(p: LeavePolicyItem): FormState {
  return {
    name: p.name,
    grantMode: p.grantMode,
    fiscalStartMonth: p.fiscalStartMonth,
    monthlyGrantRule: p.monthlyGrantRule,
    annualFirstYearRule: p.annualFirstYearRule,
    decimalRule: p.decimalRule,
    expiryMonths: p.expiryMonths,
    carryoverMaxDays: p.carryoverMaxDays != null ? String(p.carryoverMaxDays) : "",
    monthlyExpiryMode: p.monthlyExpiryMode,
    monthlyGraceMonths: p.monthlyGraceMonths != null ? String(p.monthlyGraceMonths) : "",
    annualExpiryMode: p.annualExpiryMode,
    annualGraceMonths: p.annualGraceMonths != null ? String(p.annualGraceMonths) : "",
    useUnit: p.useUnit,
    hourUnitMinutes: p.hourUnitMinutes != null ? String(p.hourUnitMinutes) : "30",
    overdraftEnabled: p.overdraftEnabled,
    overdraftMaxDays: p.overdraftMaxDays != null ? String(p.overdraftMaxDays) : "",
    approverEmployeeId: p.approverEmployeeId ?? "",
    ccEmployeeIds: p.ccEmployeeIds ?? [],
    approveOnRegister: p.approveOnRegister,
    approveOnCancel: p.approveOnCancel,
    smartPromotionEnabled: p.smartPromotionEnabled,
    isDefault: p.isDefault,
  };
}

/* ── 토글 스위치 ─────────────────────────── */
function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <div onClick={onToggle} style={{
        width: 40, height: 22, borderRadius: 999, padding: 2, cursor: "pointer",
        background: on ? "var(--primary)" : "var(--border)",
        display: "flex", alignItems: "center", transition: "background 0.2s", flexShrink: 0,
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: "50%", background: "white",
          transform: on ? "translateX(18px)" : "translateX(0)",
          transition: "transform 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
    </label>
  );
}

/* ── 섹션 헤더 (접이식) ─────────────────── */
function SectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 0", background: "none", border: "none", cursor: "pointer",
      borderTop: "1px solid var(--border)", fontSize: 13, fontWeight: 700, color: "var(--fg)",
    }}>
      {title}
      {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
  );
}

/* ── 정책 편집 폼 ───────────────────────── */
function PolicyForm({ form, set, employees }: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  employees: Employee[];
}) {
  const [grantOpen, setGrantOpen] = useState(true);
  const [expiryOpen, setExpiryOpen] = useState(false);

  const approverName = employees.find((e) => e.id === form.approverEmployeeId)?.name;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 정책명 */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 5 }}>정책명</div>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)}
          placeholder="예: 표준 연차 정책" maxLength={50} />
      </div>

      {/* ── 기본 설정 ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>기본 설정</div>

        {/* 승인·참조자 */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 5 }}>승인자</div>
          <select className={SELECT_CLS} value={form.approverEmployeeId}
            onChange={(e) => set("approverEmployeeId", e.target.value)}>
            <option value="">승인 없음 (즉시 등록)</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          {form.approverEmployeeId && (
            <p style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 4 }}>
              {approverName}님이 모든 연차 신청을 승인해요.
            </p>
          )}
        </div>

        {/* 참조자 */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 5 }}>참조자</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 5 }}>
            {form.ccEmployeeIds.map((id) => {
              const name = employees.find((e) => e.id === id)?.name ?? id;
              return (
                <span key={id} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 8px", borderRadius: 999, fontSize: 12,
                  border: "1.5px solid var(--border)", background: "var(--bg-secondary)",
                }}>
                  {name}
                  <button type="button"
                    onClick={() => set("ccEmployeeIds", form.ccEmployeeIds.filter((x) => x !== id))}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-muted)", lineHeight: 1, padding: 0 }}>×</button>
                </span>
              );
            })}
          </div>
          <select className={SELECT_CLS} value=""
            onChange={(e) => {
              const id = e.target.value;
              if (id && !form.ccEmployeeIds.includes(id)) set("ccEmployeeIds", [...form.ccEmployeeIds, id]);
            }}>
            <option value="">참조자 추가…</option>
            {employees.filter((e) => !form.ccEmployeeIds.includes(e.id)).map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        {/* 승인 요청 시점 */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 8 }}>승인 요청 시점</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Toggle on={form.approveOnRegister} onToggle={() => set("approveOnRegister", !form.approveOnRegister)} label="휴가를 등록할 때" />
            <Toggle on={form.approveOnCancel} onToggle={() => set("approveOnCancel", !form.approveOnCancel)} label="등록한 휴가를 취소할 때" />
          </div>
        </div>

        {/* 연차 사용 단위 */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 5 }}>연차 사용 단위</div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["HOUR", "HALF_DAY", "DAY"] as LeaveUseUnit[]).map((v) => (
              <button key={v} type="button" onClick={() => set("useUnit", v)} style={{
                flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                border: `1.5px solid ${form.useUnit === v ? "var(--primary)" : "var(--border)"}`,
                background: form.useUnit === v ? "var(--primary-soft)" : "var(--bg-primary)",
                color: form.useUnit === v ? "var(--primary)" : "var(--fg-muted)", cursor: "pointer",
              }}>{USE_UNIT_LABEL[v]}</button>
            ))}
          </div>
          {form.useUnit === "HOUR" && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginBottom: 5 }}>시간 단위</div>
              <select className={SELECT_CLS} value={form.hourUnitMinutes}
                onChange={(e) => set("hourUnitMinutes", e.target.value)}>
                {HOUR_UNIT_OPTIONS.map((o) => (
                  <option key={o.value} value={String(o.value)}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 당겨쓰기 */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 5 }}>당겨쓰기 설정</div>
          <select className={SELECT_CLS} value={form.overdraftEnabled ? "limited" : "free"}
            onChange={(e) => set("overdraftEnabled", e.target.value === "limited")}>
            <option value="free">자유롭게 사용 가능</option>
            <option value="limited">사용량 제한</option>
          </select>
          {form.overdraftEnabled && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12.5, color: "var(--fg-muted)", whiteSpace: "nowrap" }}>최대 사용량</span>
              <Input type="number" min={0} placeholder="예: 5" value={form.overdraftMaxDays}
                onChange={(e) => set("overdraftMaxDays", e.target.value)} />
              <span style={{ fontSize: 12.5, color: "var(--fg-muted)", whiteSpace: "nowrap" }}>일</span>
            </div>
          )}
          {form.overdraftEnabled && form.overdraftMaxDays && (
            <p style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 5 }}>
              보유 연차 소진 시 다음 부여분에서 최대 {form.overdraftMaxDays}일까지 당겨쓸 수 있어요.
            </p>
          )}
        </div>
      </div>

      {/* ── 연차 부여 방식 (접이식) ── */}
      <SectionHeader title="연차 부여 방식" open={grantOpen} onToggle={() => setGrantOpen((p) => !p)} />
      {grantOpen && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 5 }}>부여 기준일</div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["FISCAL_YEAR", "HIRE_DATE"] as LeavePolicyGrantMode[]).map((v) => (
                <button key={v} type="button" onClick={() => set("grantMode", v)} style={{
                  flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                  border: `1.5px solid ${form.grantMode === v ? "var(--primary)" : "var(--border)"}`,
                  background: form.grantMode === v ? "var(--primary-soft)" : "var(--bg-primary)",
                  color: form.grantMode === v ? "var(--primary)" : "var(--fg-muted)", cursor: "pointer",
                }}>{GRANT_MODE_LABEL[v]}</button>
              ))}
            </div>
          </div>

          {form.grantMode === "FISCAL_YEAR" && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 5 }}>회계일</div>
              <select className={SELECT_CLS} value={form.fiscalStartMonth}
                onChange={(e) => set("fiscalStartMonth", Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}월 1일</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 5 }}>입사자 월차</div>
            <select className={SELECT_CLS} value={form.monthlyGrantRule}
              onChange={(e) => set("monthlyGrantRule", e.target.value as MonthlyGrantRule)}>
              <option value="MONTHLY_ON_ATTENDANCE">매월 개근 시 1일 부여</option>
              <option value="LUMP_SUM_ON_HIRE_11">입사일에 11일 선부여</option>
              <option value="LUMP_SUM_UNTIL_FISCAL">입사일에 회계일까지 월차 선부여</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 5 }}>입사자 1년 만근 연차</div>
            <select className={SELECT_CLS} value={form.annualFirstYearRule}
              onChange={(e) => set("annualFirstYearRule", e.target.value as AnnualFirstYearRule)}>
              <option value="PRORATED_ON_FIRST_FISCAL">첫 회계일에 근무한 기간의 연차 부여 (추천)</option>
              <option value="DAYS_15_ON_FIRST_FISCAL">첫 회계일에 15일 부여</option>
              <option value="DAYS_15_ON_ANNIVERSARY">1년 만근 시 15일 부여</option>
              <option value="LUMP_SUM_ON_HIRE_15">입사일에 회계일까지 연차 선부여</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 5 }}>소수점 이하 연차</div>
            <select className={SELECT_CLS} value={form.decimalRule}
              onChange={(e) => set("decimalRule", e.target.value as DecimalRule)}>
              <option value="ROUND_UP_DAY">일 단위 올림 처리 (추천)</option>
              <option value="ROUND_UP_HALF">연차 단위 올림 처리</option>
              <option value="NO_ADJUSTMENT">조정 안 함</option>
            </select>
          </div>
        </div>
      )}

      {/* ── 자동 소멸 설정 (접이식) ── */}
      <SectionHeader title="자동 소멸 설정" open={expiryOpen} onToggle={() => setExpiryOpen((p) => !p)} />
      {expiryOpen && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 5 }}>월차 자동 소멸 시점</div>
            <select className={SELECT_CLS} value={form.monthlyExpiryMode}
              onChange={(e) => set("monthlyExpiryMode", e.target.value as MonthlyExpiryMode)}>
              {(Object.keys(MONTHLY_EXPIRY_LABEL) as MonthlyExpiryMode[]).map((v) => (
                <option key={v} value={v}>{MONTHLY_EXPIRY_LABEL[v]}</option>
              ))}
            </select>
            {form.monthlyExpiryMode !== "NONE" && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginBottom: 5 }}>소멸 유예 기간</div>
                <select className={SELECT_CLS} value={form.monthlyGraceMonths}
                  onChange={(e) => set("monthlyGraceMonths", e.target.value)}>
                  {GRACE_MONTH_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 5 }}>연차 자동 소멸 시점</div>
            <select className={SELECT_CLS} value={form.annualExpiryMode}
              onChange={(e) => set("annualExpiryMode", e.target.value as AnnualExpiryMode)}>
              {(Object.keys(ANNUAL_EXPIRY_LABEL) as AnnualExpiryMode[]).map((v) => (
                <option key={v} value={v}>{ANNUAL_EXPIRY_LABEL[v]}</option>
              ))}
            </select>
            {form.annualExpiryMode !== "NONE" && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginBottom: 5 }}>소멸 유예 기간</div>
                <select className={SELECT_CLS} value={form.annualGraceMonths}
                  onChange={(e) => set("annualGraceMonths", e.target.value)}>
                  {GRACE_MONTH_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 5 }}>이월 최대 일수</div>
            <Input type="number" min={0} placeholder="비워두면 제한 없음" value={form.carryoverMaxDays}
              onChange={(e) => set("carryoverMaxDays", e.target.value)} />
          </div>
        </div>
      )}

      {/* 스마트 연차 촉진 */}
      <div style={{ paddingTop: 4, borderTop: "1px solid var(--border)" }}>
        <Toggle
          on={form.smartPromotionEnabled}
          onToggle={() => set("smartPromotionEnabled", !form.smartPromotionEnabled)}
          label="스마트 연차 촉진 사용"
        />
        {form.smartPromotionEnabled && (
          <p style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 6 }}>
            법정 소멸일 6개월 전(연차) · 3개월/1개월 전(월차)에 자동 촉진 알림을 보내요.
          </p>
        )}
      </div>

      {/* 기본 정책 */}
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
        <input type="checkbox" checked={form.isDefault}
          onChange={(e) => set("isDefault", e.target.checked)}
          style={{ width: 15, height: 15, cursor: "pointer" }} />
        이 정책을 기본 정책으로 설정
      </label>
    </div>
  );
}

/* ── 메인 컴포넌트 ───────────────────────── */
export function LeavePoliciesClient({ initialPolicies, annualTypeId, employees }: Props) {
  const router = useRouter();
  const [policies, setPolicies] = useState(initialPolicies);
  useEffect(() => { setPolicies(initialPolicies); }, [initialPolicies]);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LeavePolicyItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeavePolicyItem | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function buildInput(f: FormState) {
    return {
      name: f.name,
      leaveTypeId: annualTypeId,
      grantMode: f.grantMode,
      fiscalStartMonth: f.fiscalStartMonth,
      monthlyGrantRule: f.monthlyGrantRule,
      annualFirstYearRule: f.annualFirstYearRule,
      decimalRule: f.decimalRule,
      expiryMonths: f.expiryMonths,
      carryoverMaxDays: f.carryoverMaxDays !== "" ? Number(f.carryoverMaxDays) : null,
      useUnit: f.useUnit,
      hourUnitMinutes: f.useUnit === "HOUR" && f.hourUnitMinutes ? Number(f.hourUnitMinutes) : null,
      overdraftEnabled: f.overdraftEnabled,
      overdraftMaxDays: f.overdraftEnabled && f.overdraftMaxDays ? Number(f.overdraftMaxDays) : null,
      monthlyExpiryMode: f.monthlyExpiryMode,
      monthlyGraceMonths: f.monthlyGraceMonths !== "" ? Number(f.monthlyGraceMonths) : null,
      annualExpiryMode: f.annualExpiryMode,
      annualGraceMonths: f.annualGraceMonths !== "" ? Number(f.annualGraceMonths) : null,
      approverEmployeeId: f.approverEmployeeId || null,
      ccEmployeeIds: f.ccEmployeeIds,
      approveOnRegister: f.approveOnRegister,
      approveOnCancel: f.approveOnCancel,
      smartPromotionEnabled: f.smartPromotionEnabled,
      isDefault: f.isDefault,
    };
  }

  function openCreate() {
    setForm(defaultForm());
    setError(null);
    setCreateOpen(true);
  }

  function openEdit(p: LeavePolicyItem) {
    setForm(policyToForm(p));
    setError(null);
    setEditTarget(p);
  }

  function handleCreate() {
    if (!form.name.trim()) { setError("정책명을 입력해 주세요"); return; }
    if (!annualTypeId) { setError("연차 휴가 유형이 없어요. 먼저 연차 종류를 생성해 주세요."); return; }
    setError(null);
    startTransition(async () => {
      const res = await createLeavePolicyAction(buildInput(form));
      if (!res.ok) { setError(res.error.message); return; }
      setCreateOpen(false);
      router.refresh();
    });
  }

  function handleEdit() {
    if (!editTarget) return;
    if (!form.name.trim()) { setError("정책명을 입력해 주세요"); return; }
    setError(null);
    startTransition(async () => {
      const res = await updateLeavePolicyAction(editTarget.id, buildInput(form));
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
      setDeleteTarget(null);
      router.refresh();
    });
  }

  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  async function handleBootstrap() {
    setBootstrapping(true);
    setBootstrapError(null);
    try {
      const res = await bootstrapLeaveTypesAction();
      if (res.ok) {
        window.location.reload();
      } else {
        setBootstrapError(res.error ?? "자동 생성에 실패했어요");
        setBootstrapping(false);
      }
    } catch (e) {
      setBootstrapError("오류가 발생했어요. 새로고침 후 다시 시도해 주세요.");
      setBootstrapping(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 연차 유형 없음 안내 */}
      {!annualTypeId && (
        <div style={{
          padding: "14px 18px", borderRadius: 12,
          background: "#fffbeb", border: "1.5px solid #fcd34d",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#92400e" }}>연차 휴가 유형이 없어요</div>
            <div style={{ fontSize: 12.5, color: "#a16207", marginTop: 3 }}>
              연차 정책을 만들려면 먼저 "연차" 휴가 유형이 필요해요. 아래 버튼으로 자동 생성할 수 있어요.
            </div>
            {bootstrapError && (
              <div style={{ fontSize: 12, color: "#dc2626", marginTop: 6, fontWeight: 600 }}>
                오류: {bootstrapError}
              </div>
            )}
          </div>
          <Button onClick={handleBootstrap} disabled={bootstrapping}>
            {bootstrapping ? "생성 중…" : "연차 유형 자동 생성"}
          </Button>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={openCreate}>+ 연차 정책 추가</Button>
      </div>

      {policies.length === 0 ? (
        <div style={{
          borderRadius: 14, border: "1px solid var(--border)", padding: "40px 24px",
          textAlign: "center", fontSize: 13.5, color: "var(--fg-muted)",
        }}>
          등록된 연차 정책이 없어요. 정책을 추가하고 구성원에게 배정하세요.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {policies.map((p) => (
            <div key={p.id} style={{
              borderRadius: 12, border: "1px solid var(--border)",
              background: "var(--bg-primary)", padding: "14px 18px",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</span>
                    {p.isDefault && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: "var(--primary-soft)", color: "var(--primary)" }}>기본</span>
                    )}
                    {!p.isActive && (
                      <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 999, background: "var(--bg-secondary)", color: "var(--fg-muted)" }}>비활성</span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", fontSize: 12, color: "var(--fg-subtle)" }}>
                    <span>{p.grantMode === "FISCAL_YEAR" ? "회계연도" : "입사일"} 기준</span>
                    <span>·</span>
                    <span>사용단위: {USE_UNIT_LABEL[p.useUnit]}</span>
                    <span>·</span>
                    <span>{p.approverEmployeeId ? "승인 있음" : "승인 없음"}</span>
                    <span>·</span>
                    <span>스마트 촉진: {p.smartPromotionEnabled ? "사용 중" : "미사용"}</span>
                  </div>
                  <p style={{ marginTop: 4, fontSize: 12, color: "var(--fg-subtle)" }}>
                    배정된 구성원 {p.assignedCount}명
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>연차 정책 추가</DialogTitle>
          </DialogHeader>
          <PolicyForm form={form} set={set} employees={employees} />
          {error && (
            <p style={{ fontSize: 12.5, color: "#dc2626", borderRadius: 8, border: "1px solid #fca5a5", background: "#fef2f2", padding: "8px 12px" }}>{error}</p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isPending}>취소</Button>
            </DialogClose>
            <Button onClick={handleCreate} disabled={isPending || !form.name.trim()}>
              {isPending ? "저장 중…" : "저장하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!isPending && !o) setEditTarget(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget?.name} 수정</DialogTitle>
          </DialogHeader>
          <PolicyForm form={form} set={set} employees={employees} />
          {error && (
            <p style={{ fontSize: 12.5, color: "#dc2626", borderRadius: 8, border: "1px solid #fca5a5", background: "#fef2f2", padding: "8px 12px" }}>{error}</p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isPending}>취소</Button>
            </DialogClose>
            <Button onClick={handleEdit} disabled={isPending || !form.name.trim()}>
              {isPending ? "저장 중…" : "저장하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!isPending && !o) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정책 삭제</DialogTitle>
          </DialogHeader>
          <p style={{ fontSize: 13.5, color: "var(--fg-muted)" }}>
            <strong style={{ color: "var(--fg)" }}>{deleteTarget?.name}</strong> 정책을 삭제할까요?
            {deleteTarget && deleteTarget.assignedCount > 0 && (
              <span style={{ display: "block", marginTop: 6, color: "#dc2626" }}>배정된 구성원이 있어 삭제할 수 없어요.</span>
            )}
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isPending}>취소</Button>
            </DialogClose>
            <Button variant="destructive"
              disabled={isPending || (deleteTarget?.assignedCount ?? 0) > 0}
              onClick={handleDelete}>
              {isPending ? "삭제 중…" : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
