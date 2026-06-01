"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@teamlet/ui";
import { updateCompanyLeaveSettingsAction } from "@/lib/actions/company-leave-settings";
import type { CompanyLeaveSettingsItem } from "@teamlet/modules/leave";
import type { RetirementAdjustMode } from "@teamlet/db";

type Employee = { id: string; name: string };

const PLAN_NOTICE_OPTIONS = [1, 3, 5, 7, 10];
const PROMOTION_OFFSET_OPTIONS = [
  { value: 0, label: "+0일 후" },
  { value: 5, label: "+5일 후" },
  { value: 10, label: "+10일 후" },
];

function Toggle({ on, onToggle, label, desc }: { on: boolean; onToggle: () => void; label: string; desc?: string }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
      <div onClick={onToggle} style={{
        marginTop: 2, width: 40, height: 22, borderRadius: 999, padding: 2, cursor: "pointer", flexShrink: 0,
        background: on ? "var(--primary)" : "var(--border)",
        display: "flex", alignItems: "center", transition: "background 0.2s",
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: "50%", background: "white",
          transform: on ? "translateX(18px)" : "translateX(0)",
          transition: "transform 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        {desc && <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 2 }}>{desc}</div>}
      </div>
    </label>
  );
}

const SELECT_CLS = "h-9 w-full rounded-lg border border-border bg-background-primary px-3 text-sm text-foreground outline-none focus:border-foreground-subtle";

/* ── 퇴직자 조정 모달 ─────────────────────── */
function RetirementModal({
  initial,
  onClose,
}: {
  initial: RetirementAdjustMode;
  onClose: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<RetirementAdjustMode>(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateCompanyLeaveSettingsAction({ retirementAdjustMode: mode });
      if (!res.ok) { setError(res.error.message); return; }
      onClose(); router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          {
            value: "EMPLOYEE_FAVORABLE" as RetirementAdjustMode,
            label: "구성원에게 유리한 기준으로 적용",
            desc: "근로기준법 기준과 실제 회사 부여량 중 더 큰 값으로 계산해요.",
          },
          {
            value: "LABOR_LAW" as RetirementAdjustMode,
            label: "항상 근로기준법 기준으로 적용",
            desc: "입사일 기준 근로기준법 연차 계산식을 사용해요.",
          },
        ].map(({ value, label, desc }) => (
          <label key={value} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${mode === value ? "var(--primary)" : "var(--border)"}`, background: mode === value ? "var(--primary-soft)" : "var(--bg-primary)" }}>
            <input type="radio" name="retirementMode" value={value} checked={mode === value}
              onChange={() => setMode(value)} style={{ marginTop: 3, accentColor: "var(--primary)" }} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 3 }}>{desc}</div>
            </div>
          </label>
        ))}
      </div>

      {/* 예시 테이블 */}
      {(() => {
        const examples = [
          { name: "김연차", laborDays: 15, companyDays: 10 },
          { name: "김조정", laborDays: 15, companyDays: 20 },
        ];
        return (
          <div style={{ borderRadius: 8, border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "6px 12px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 600, color: "var(--fg-muted)" }}>예시</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  {["구성원", "근로기준법 기준 부여량", "실제 회사 부여량"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--fg-muted)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {examples.map((ex, i) => {
                  const laborWins = mode === "LABOR_LAW" || ex.laborDays >= ex.companyDays;
                  const companyWins = mode === "LABOR_LAW" ? false : ex.companyDays > ex.laborDays;
                  return (
                    <tr key={i} style={{ borderBottom: i < examples.length - 1 ? "1px solid var(--border)" : undefined }}>
                      <td style={{ padding: "10px 12px", color: "var(--fg)", display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--fg-muted)", flexShrink: 0 }}>
                          {ex.name[0]}
                        </div>
                        {ex.name}
                      </td>
                      <td style={{
                        padding: "10px 12px", fontWeight: laborWins ? 700 : 400,
                        color: laborWins ? "#166534" : "var(--fg-muted)",
                        background: laborWins ? "#f0fdf4" : "transparent",
                      }}>
                        {laborWins && <span style={{ marginRight: 4 }}>✓</span>}{ex.laborDays}일
                      </td>
                      <td style={{
                        padding: "10px 12px", fontWeight: companyWins ? 700 : 400,
                        color: companyWins ? "#166534" : "var(--fg-muted)",
                        background: companyWins ? "#f0fdf4" : "transparent",
                      }}>
                        {companyWins && <span style={{ marginRight: 4 }}>✓</span>}{ex.companyDays}일
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })()}

      {error && <p style={{ fontSize: 12.5, color: "#dc2626" }}>{error}</p>}

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary" disabled={isPending}>취소</Button>
        </DialogClose>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "저장 중…" : "변경 사항 적용하기"}
        </Button>
      </DialogFooter>
    </div>
  );
}

/* ── 연차 촉진 설정 모달 ──────────────────── */
function PromotionModal({
  initial,
  employees,
  onClose,
}: {
  initial: CompanyLeaveSettingsItem;
  employees: Employee[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    promotionApproverEmployeeId: initial.promotionApproverEmployeeId ?? "",
    promotionCcEmployeeIds: initial.promotionCcEmployeeIds,
    memberRemindEnabled: initial.memberRemindEnabled,
    adminRemindEnabled: initial.adminRemindEnabled,
    planNoticeDaysBefore: initial.planNoticeDaysBefore,
    annualPromotionMonthsBefore: initial.annualPromotionMonthsBefore,
    annualPromotionOffsetDays: initial.annualPromotionOffsetDays,
    monthly1stPromotionMonthsBefore: initial.monthly1stPromotionMonthsBefore,
    monthly1stPromotionOffsetDays: initial.monthly1stPromotionOffsetDays,
    monthly2ndPromotionMonthsBefore: initial.monthly2ndPromotionMonthsBefore,
    monthly2ndPromotionOffsetDays: initial.monthly2ndPromotionOffsetDays,
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateCompanyLeaveSettingsAction({
        ...form,
        promotionApproverEmployeeId: form.promotionApproverEmployeeId || null,
      });
      if (!res.ok) { setError(res.error.message); return; }
      onClose(); router.refresh();
    });
  }

  const approverName = employees.find((e) => e.id === form.promotionApproverEmployeeId)?.name;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 승인·참조 대상 */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 5 }}>승인 담당자</div>
        <select className={SELECT_CLS} value={form.promotionApproverEmployeeId}
          onChange={(e) => set("promotionApproverEmployeeId", e.target.value)}>
          <option value="">담당자 없음</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        {form.promotionApproverEmployeeId && (
          <p style={{ fontSize: 11.5, color: "var(--fg-muted)", marginTop: 4 }}>{approverName}님이 촉진 문서를 승인해요.</p>
        )}
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 5 }}>참조자</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 5 }}>
          {form.promotionCcEmployeeIds.map((id) => {
            const name = employees.find((e) => e.id === id)?.name ?? id;
            return (
              <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 999, fontSize: 12, border: "1.5px solid var(--border)", background: "var(--bg-secondary)" }}>
                {name}
                <button type="button"
                  onClick={() => set("promotionCcEmployeeIds", form.promotionCcEmployeeIds.filter((x) => x !== id))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-muted)", lineHeight: 1, padding: 0 }}>×</button>
              </span>
            );
          })}
        </div>
        <select className={SELECT_CLS} value=""
          onChange={(e) => {
            const id = e.target.value;
            if (id && !form.promotionCcEmployeeIds.includes(id)) set("promotionCcEmployeeIds", [...form.promotionCcEmployeeIds, id]);
          }}>
          <option value="">참조자 추가…</option>
          {employees.filter((e) => !form.promotionCcEmployeeIds.includes(e.id)).map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>

      {/* 리마인드 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Toggle on={form.memberRemindEnabled} onToggle={() => set("memberRemindEnabled", !form.memberRemindEnabled)}
          label="구성원 작성 리마인드" desc="사용 계획 작성 알림을 제출 기한 동안 매일 보내요." />
        <Toggle on={form.adminRemindEnabled} onToggle={() => set("adminRemindEnabled", !form.adminRemindEnabled)}
          label="관리자 작성 리마인드" desc="관리자 대신 작성 기간 리마인드를 받아요." />
      </div>

      {/* 사용 계획일 알림 시점 */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 5 }}>사용 계획일 알림 시점</div>
        <div style={{ display: "flex", gap: 6 }}>
          {PLAN_NOTICE_OPTIONS.map((d) => (
            <button key={d} type="button" onClick={() => set("planNoticeDaysBefore", d)} style={{
              flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: `1.5px solid ${form.planNoticeDaysBefore === d ? "var(--primary)" : "var(--border)"}`,
              background: form.planNoticeDaysBefore === d ? "var(--primary-soft)" : "var(--bg-primary)",
              color: form.planNoticeDaysBefore === d ? "var(--primary)" : "var(--fg-muted)", cursor: "pointer",
            }}>{d}일 전</button>
          ))}
        </div>
      </div>

      {/* 스마트 연차 촉진 시점 */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>스마트 연차 촉진 시점</div>
        <p style={{ fontSize: 11.5, color: "var(--fg-muted)", marginBottom: 12 }}>
          스마트 연차 촉진은 소멸 유예 설정과 관계없이 법정 연차 소멸일 기준으로 실행돼요.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* 연차 (1년 이상) */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 6 }}>연차 촉진 시점 (1년 이상)</div>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "var(--fg-subtle)", marginBottom: 4 }}>소멸 N개월 전</div>
                <select className={SELECT_CLS} value={form.annualPromotionMonthsBefore}
                  onChange={(e) => set("annualPromotionMonthsBefore", Number(e.target.value))}>
                  {[3, 4, 5, 6].map((m) => <option key={m} value={m}>소멸 {m}개월 전</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "var(--fg-subtle)", marginBottom: 4 }}>추가 오프셋</div>
                <select className={SELECT_CLS} value={form.annualPromotionOffsetDays}
                  onChange={(e) => set("annualPromotionOffsetDays", Number(e.target.value))}>
                  {PROMOTION_OFFSET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 월차 1차 (1년 미만) */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 6 }}>월차 1차 촉진 (1년 미만)</div>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ flex: 1 }}>
                <select className={SELECT_CLS} value={form.monthly1stPromotionMonthsBefore}
                  onChange={(e) => set("monthly1stPromotionMonthsBefore", Number(e.target.value))}>
                  {[2, 3, 4].map((m) => <option key={m} value={m}>소멸 {m}개월 전</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <select className={SELECT_CLS} value={form.monthly1stPromotionOffsetDays}
                  onChange={(e) => set("monthly1stPromotionOffsetDays", Number(e.target.value))}>
                  {PROMOTION_OFFSET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 월차 2차 (1년 미만) */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 6 }}>월차 2차 촉진 (1년 미만)</div>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ flex: 1 }}>
                <select className={SELECT_CLS} value={form.monthly2ndPromotionMonthsBefore}
                  onChange={(e) => set("monthly2ndPromotionMonthsBefore", Number(e.target.value))}>
                  {[1, 2].map((m) => <option key={m} value={m}>소멸 {m}개월 전</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <select className={SELECT_CLS} value={form.monthly2ndPromotionOffsetDays}
                  onChange={(e) => set("monthly2ndPromotionOffsetDays", Number(e.target.value))}>
                  {PROMOTION_OFFSET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <p style={{ fontSize: 12.5, color: "#dc2626" }}>{error}</p>}

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary" disabled={isPending}>취소</Button>
        </DialogClose>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "저장 중…" : "변경 사항 저장"}
        </Button>
      </DialogFooter>
    </div>
  );
}

/* ── 메인 섹션 ────────────────────────────── */
export function CompanyLeaveSettingsSection({
  initial,
  employees,
}: {
  initial: CompanyLeaveSettingsItem;
  employees: Employee[];
}) {
  const [retirementOpen, setRetirementOpen] = useState(false);
  const [promotionOpen, setPromotionOpen] = useState(false);

  const retirementLabel =
    initial.retirementAdjustMode === "EMPLOYEE_FAVORABLE"
      ? "구성원에게 유리한 기준으로 적용"
      : "항상 근로기준법 기준으로 적용";

  return (
    <>
      <div style={{ borderRadius: 14, border: "1px solid var(--border)", background: "var(--bg-primary)", overflow: "hidden" }}>
        {[
          {
            label: "퇴직자 연차 조정 기준 설정",
            value: retirementLabel,
            onClick: () => setRetirementOpen(true),
          },
          {
            label: "연차 촉진 설정",
            value: initial.memberRemindEnabled || initial.adminRemindEnabled ? "설정됨" : ">",
            onClick: () => setPromotionOpen(true),
          },
        ].map((item, i, arr) => (
          <button key={item.label} type="button" onClick={item.onClick} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 18px", background: "none", border: "none", cursor: "pointer",
            borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : undefined,
            transition: "background 0.15s",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-secondary)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg)" }}>{item.label}</span>
            <span style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>{item.value} ›</span>
          </button>
        ))}
      </div>

      {/* 퇴직자 조정 모달 */}
      <Dialog open={retirementOpen} onOpenChange={(o) => { if (!o) setRetirementOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>퇴직자 연차 조정 기준</DialogTitle>
          </DialogHeader>
          <RetirementModal initial={initial.retirementAdjustMode} onClose={() => setRetirementOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* 연차 촉진 설정 모달 */}
      <Dialog open={promotionOpen} onOpenChange={(o) => { if (!o) setPromotionOpen(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>연차 촉진 설정</DialogTitle>
          </DialogHeader>
          <PromotionModal initial={initial} employees={employees} onClose={() => setPromotionOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
