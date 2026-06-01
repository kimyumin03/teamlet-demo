"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@teamlet/ui";
import type { LeaveTypeItem, LeaveBalanceSummary } from "@teamlet/modules/leave";
import { requestLeaveAction, getHolidayDatesAction } from "@/lib/actions/leave";
import { uploadFile } from "@/lib/upload-client";

/* ── 부여 방식 레이블 ─────────────────────── */
function grantLabel(t: LeaveTypeItem, balance?: LeaveBalanceSummary): string {
  if (balance && (balance.grantedDays > 0 || balance.adjustedDays > 0)) return `잔여 ${balance.remainingDays}일`;
  const amt = t.grantAmount;
  switch (t.grantMethod) {
    case "ON_REQUEST":         return amt ? `신청 시 ${amt}일 부여` : "신청 시 부여";
    case "ON_OTHER_EXHAUSTED": return amt ? `연차 소진 시 ${amt}일` : "연차 소진 시 부여";
    case "MANUAL":             return "관리자 직접 부여";
    case "ON_HIRE":            return amt ? `입사 시 ${amt}일 부여` : "입사 시 부여";
    case "PERIODIC":           return amt ? `매월 ${amt}일 부여` : "주기적 부여";
    case "ON_TENURE":          return amt ? `근속 시 ${amt}일 부여` : "근속 시 부여";
    default:                   return "부여";
  }
}

/* ── 시간 유틸 ──────────────────────────── */
const TIME_OPTIONS = (() => {
  const opts: { value: string; label: string }[] = [];
  for (let h = 7; h <= 22; h++) {
    for (const m of [0, 30]) {
      const hh = h.toString().padStart(2, "0");
      const mm = m === 0 ? "00" : "30";
      const period = h < 12 ? "오전" : "오후";
      const dh = h <= 12 ? h : h - 12;
      opts.push({ value: `${hh}:${mm}`, label: `${period} ${dh}:${mm}` });
    }
  }
  return opts;
})();

function timeLabel(v: string) { return TIME_OPTIONS.find((o) => o.value === v)?.label ?? v; }

function minutesBetween(a: string, b: string) {
  const ap = a.split(":").map(Number);
  const bp = b.split(":").map(Number);
  const [ah = 0, am = 0] = ap;
  const [bh = 0, bm = 0] = bp;
  return (bh * 60 + bm) - (ah * 60 + am);
}
function fmtDuration(start: string, end: string) {
  const m = minutesBetween(start, end);
  if (m <= 0) return "";
  return m % 60 === 0 ? `${m / 60}시간` : `${Math.floor(m / 60)}시간 ${m % 60}분`;
}

/* ── 영업일 계산 ─────────────────────────── */
function calcBusinessDays(start: string, end: string, holidays: Set<string>): number {
  if (!start || !end) return 0;
  const s = new Date(start), e = new Date(end);
  if (s > e) return 0;
  let n = 0;
  const c = new Date(s);
  while (c <= e) {
    const d = c.getDay();
    if (d !== 0 && d !== 6 && !holidays.has(c.toISOString().slice(0, 10))) n++;
    c.setDate(c.getDate() + 1);
  }
  return n;
}

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`;
}

type UnitType = "full" | "morning" | "afternoon" | "hourly";
const MORNING_S = "09:00", MORNING_E = "14:00";
const AFTERNOON_S = "14:00", AFTERNOON_E = "18:00";

/* ─────────────────────────────────────────
   RequestDialog — 2단계 플로우
   Step 1: 날짜 선택 + 사용 단위 (캘린더 영역 아래에 라디오)
   Step 2: 확인 (사유 + 증명자료 + 결재자)
───────────────────────────────────────── */
function RequestDialog({
  leaveType,
  approverCandidates,
  onClose,
}: {
  leaveType: LeaveTypeItem;
  approverCandidates: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [step, setStep] = useState<"pick" | "confirm">("pick");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [unit, setUnit] = useState<UnitType>("full");
  const [hourStart, setHourStart] = useState("09:00");
  const [hourEnd, setHourEnd] = useState("10:00");
  const [reason, setReason] = useState("");
  // 휴가 종류에 고정 승인자가 있으면 우선 적용
  const fixedApproverId = leaveType.approverEmployeeId ?? null;
  const fixedApproverName = leaveType.approverName ?? null;
  const [approverId, setApproverId] = useState(fixedApproverId ?? approverCandidates[0]?.id ?? "");
  const [holidays, setHolidays] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [evidenceFileUrl, setEvidenceFileUrl] = useState<string | null>(null);
  const [evidenceFileName, setEvidenceFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    getHolidayDatesAction(parseInt(startDate.slice(0, 4))).then((d) => setHolidays(new Set(d)));
  }, [startDate]);

  const bizDays = calcBusinessDays(startDate, unit !== "full" ? startDate : endDate, holidays);
  const hourMins = minutesBetween(hourStart, hourEnd);
  const computedDays =
    unit === "full" ? bizDays :
    unit === "morning" || unit === "afternoon" ? (bizDays > 0 ? 0.5 : 0) :
    bizDays > 0 && hourMins > 0 ? Math.round(hourMins / 60 * 10) / 10 : 0;

  const restIncluded = unit === "morning" || (unit === "hourly" && hourMins >= 120);

  const unitHeaderLabel =
    unit === "full" ? "하루 종일" :
    unit === "morning" ? "오전 반차" :
    unit === "afternoon" ? "오후 반차" : "시간차";

  function handleNext() {
    if (computedDays > 0) setStep("confirm");
  }

  function handleSubmit() {
    setError(null);
    if (computedDays <= 0) { setError("사용 일수가 0이에요. 날짜와 사용 단위를 확인해 주세요."); return; }
    startTransition(async () => {
      const effEnd = unit !== "full" ? startDate : endDate;
      const res = await requestLeaveAction({
        leaveTypeId: leaveType.id,
        approverId: approverId || (approverCandidates[0]?.id ?? ""),
        startDate,
        endDate: effEnd,
        days: computedDays,
        reason: reason || undefined,
        evidenceFileUrl: evidenceFileUrl || undefined,
      });
      if (!res.ok) { setError(res.error.message); return; }
      onClose(); router.refresh();
    });
  }

  const payLabel = leaveType.paymentType === "PAID" ? "유급" : leaveType.paymentType === "UNPAID" ? "무급" : "부분유급";

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🏖</div>
        <div>
          <span style={{ fontWeight: 700, fontSize: 14.5 }}>{leaveType.name}</span>
          <span style={{ fontSize: 12, color: "var(--fg-muted)", marginLeft: 8 }}>사용 가능 · {payLabel}</span>
        </div>
        <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--fg-muted)", fontSize: 20, lineHeight: 1, padding: "0 2px" }}>×</button>
      </div>

      {/* ── STEP 1: 날짜 + 사용 단위 ── */}
      {step === "pick" && (
        <div style={{ padding: "16px 20px 20px" }}>
          {/* 날짜 선택 영역 */}
          {startDate ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
                {fmtDate(startDate)}{startDate !== endDate ? ` – ${fmtDate(endDate)}` : ` · ${unitHeaderLabel}`}
              </div>
              {leaveType.grantAmount && (
                <div style={{ fontSize: 12.5, color: "var(--fg-muted)" }}>
                  {leaveType.grantMethod === "ON_REQUEST" ? `신청 시 ${leaveType.grantAmount}일 부여` : `최대 ${leaveType.grantAmount}일`}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>날짜를 선택해주세요</div>
          )}

          {/* 날짜 입력 (캘린더 대체) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 5 }}>시작일</div>
              <input type="date" value={startDate}
                min={today}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                  if (unit !== "full") setEndDate(e.target.value);
                }}
                style={{ width: "100%", padding: "9px 11px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13.5, background: "var(--bg-primary)", color: "var(--fg)", outline: "none" }}
              />
            </div>
            {unit === "full" && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", marginBottom: 5 }}>종료일</div>
                <input type="date" value={endDate} min={startDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (e.target.value !== startDate) setUnit("full");
                  }}
                  style={{ width: "100%", padding: "9px 11px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13.5, background: "var(--bg-primary)", color: "var(--fg)", outline: "none" }}
                />
              </div>
            )}
          </div>

          {/* 일수 미리보기 */}
          {startDate && (
            <div style={{
              padding: "9px 12px", borderRadius: 8, marginBottom: 16, fontSize: 13,
              background: computedDays > 0 ? "var(--primary-soft)" : "#fef2f2",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {computedDays > 0
                ? <><span style={{ fontWeight: 700, color: "var(--primary)", fontFamily: "var(--font-mono)" }}>{computedDays}일</span><span style={{ color: "var(--fg-muted)" }}>사용 예정 · 주말·공휴일 제외</span></>
                : <span style={{ color: "#dc2626" }}>선택 기간에 사용 가능한 날이 없어요</span>
              }
            </div>
          )}

          {/* 사용 단위 라디오 — 같은 날 2번 선택(단일 날짜)일 때만 표시 */}
          {startDate === endDate && <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
            {([
              { id: "full" as UnitType, label: "하루 종일" },
              ...(startDate === endDate ? [
                { id: "morning" as UnitType, label: "오전 반차" },
                { id: "afternoon" as UnitType, label: "오후 반차" },
                { id: "hourly" as UnitType, label: "시간차" },
              ] : []),
            ] as const).map(({ id, label }) => {
              const sel = unit === id;
              return (
                <div key={id}
                  onClick={() => {
                    setUnit(id);
                    if (id !== "full") setEndDate(startDate);
                  }}
                  style={{
                    border: `1.5px solid ${sel ? "var(--primary)" : "var(--border)"}`,
                    borderRadius: 10, padding: "11px 14px", cursor: "pointer",
                    background: sel ? "var(--primary-soft)" : "var(--bg-primary)",
                    display: "flex", alignItems: "center", gap: 10,
                    transition: "border-color 0.1s, background 0.1s",
                  }}
                >
                  {/* 라디오 */}
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${sel ? "var(--primary)" : "var(--border-strong)"}`,
                    background: sel ? "var(--primary)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 14, color: sel ? "var(--primary)" : "var(--fg)" }}>{label}</span>

                  {/* 오전 반차 시간 */}
                  {id === "morning" && sel && (
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12.5, color: "var(--fg-muted)", padding: "3px 8px", background: "var(--bg-secondary)", borderRadius: 6, border: "1px solid var(--border)" }}>{timeLabel(MORNING_S)}</span>
                      <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>~</span>
                      <span style={{ fontSize: 12.5, color: "var(--fg-muted)", padding: "3px 8px", background: "var(--bg-secondary)", borderRadius: 6, border: "1px solid var(--border)" }}>{timeLabel(MORNING_E)}</span>
                      <span title="휴게 시간을 포함했어요. (1시간)" style={{ fontSize: 15, cursor: "help" }}>☕</span>
                    </div>
                  )}

                  {/* 오후 반차 시간 */}
                  {id === "afternoon" && sel && (
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12.5, color: "var(--fg-muted)", padding: "3px 8px", background: "var(--bg-secondary)", borderRadius: 6, border: "1px solid var(--border)" }}>{timeLabel(AFTERNOON_S)}</span>
                      <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>~</span>
                      <span style={{ fontSize: 12.5, color: "var(--fg-muted)", padding: "3px 8px", background: "var(--bg-secondary)", borderRadius: 6, border: "1px solid var(--border)" }}>{timeLabel(AFTERNOON_E)}</span>
                      <span title="휴게 시간을 포함하지 않았어요." style={{ fontSize: 15, cursor: "help", opacity: 0.35 }}>☕</span>
                    </div>
                  )}

                  {/* 시간차 드롭다운 */}
                  {id === "hourly" && sel && (
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
                      <select value={hourStart} onChange={(e) => setHourStart(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ padding: "3px 6px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12, background: "var(--bg-primary)", color: "var(--fg)" }}>
                        {TIME_OPTIONS.filter((o) => o.value < hourEnd).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>~</span>
                      <select value={hourEnd} onChange={(e) => setHourEnd(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ padding: "3px 6px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12, background: "var(--bg-primary)", color: "var(--fg)" }}>
                        {TIME_OPTIONS.filter((o) => o.value > hourStart).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <span
                        title={restIncluded ? "휴게 시간을 포함했어요. (1시간)" : "휴게 시간을 포함하지 않았어요."}
                        style={{ fontSize: 15, cursor: "help", opacity: restIncluded ? 1 : 0.35 }}
                      >☕</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>}

          <button
            onClick={handleNext}
            disabled={computedDays <= 0}
            style={{
              width: "100%", padding: "13px", borderRadius: 10, fontSize: 15, fontWeight: 700,
              background: computedDays > 0 ? "var(--primary)" : "var(--bg-tertiary)",
              color: computedDays > 0 ? "white" : "var(--fg-muted)",
              border: "none", cursor: computedDays > 0 ? "pointer" : "default",
            }}
          >
            다음
          </button>
        </div>
      )}

      {/* ── STEP 2: 확인 ── */}
      {step === "confirm" && (
        <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>휴가를 등록할까요?</h3>

          {/* 선택 요약 */}
          <div style={{
            border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--bg-primary)",
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                {fmtDate(startDate)}{startDate !== endDate ? ` – ${fmtDate(endDate)}` : ` · ${unitHeaderLabel}`}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginTop: 2 }}>
                {unit === "morning" ? `${timeLabel(MORNING_S)} — ${timeLabel(MORNING_E)} (4시간)`
                  : unit === "afternoon" ? `${timeLabel(AFTERNOON_S)} — ${timeLabel(AFTERNOON_E)} (4시간)`
                  : unit === "hourly" ? `${timeLabel(hourStart)} — ${timeLabel(hourEnd)}${hourMins > 0 ? ` (${fmtDuration(hourStart, hourEnd)})` : ""}`
                  : `총 ${computedDays}일`}
              </div>
            </div>
            <button onClick={() => setStep("pick")}
              style={{ fontSize: 12.5, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
              다시 선택하기 &gt;
            </button>
          </div>

          {/* 사유 */}
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 3 }}>사유</div>
            <p style={{ fontSize: 12.5, color: "var(--fg-muted)", margin: "0 0 6px" }}>휴가 사용 기록에 남길 수 있어요.</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)}
              maxLength={200} rows={3}
              style={{
                width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8,
                fontSize: 13, resize: "none", background: "var(--bg-primary)", color: "var(--fg)", outline: "none", fontFamily: "inherit",
              }} />
          </div>

          {/* 증명 자료 첨부 */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 13.5 }}>증명 자료</span>
              {leaveType.evidenceRequirement !== "NONE" && (
                <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 999, background: "var(--bg-tertiary)", color: "var(--fg-muted)", fontWeight: 500 }}>
                  {leaveType.evidenceRequirement === "AFTER" ? "나중 제출 가능" : "사전 제출"}
                </span>
              )}
            </div>
            {evidenceFileName ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--bg-secondary)", fontSize: 13 }}>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--fg)" }}>📎 {evidenceFileName}</span>
                <button type="button" onClick={() => { setEvidenceFileUrl(null); setEvidenceFileName(null); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--fg-muted)", fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
              </div>
            ) : (
              <label style={{ display: "block", cursor: isUploading ? "wait" : "pointer" }}>
                <div style={{
                  border: "1.5px dashed var(--border)", borderRadius: 10, padding: "14px",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  color: "var(--fg-muted)", fontSize: 13, background: "var(--bg-secondary)",
                  opacity: isUploading ? 0.6 : 1,
                }}>
                  {isUploading ? "업로드 중…" : "⬆ 파일 선택 (PDF · 이미지 · 문서)"}
                </div>
                <input type="file" style={{ display: "none" }}
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.hwp"
                  disabled={isUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsUploading(true);
                    const result = await uploadFile(file, "employee-documents");
                    setIsUploading(false);
                    if (result.ok) {
                      setEvidenceFileUrl(result.url);
                      setEvidenceFileName(file.name);
                    } else {
                      setError(result.error);
                    }
                    e.target.value = "";
                  }} />
              </label>
            )}
          </div>

          {/* 승인자 안내 — 항상 표시 */}
          {(() => {
            const name = fixedApproverName ?? (approverCandidates[0]?.name);
            if (!name) return (
              <div style={{ fontSize: 12.5, color: "var(--fg-muted)", textAlign: "center" }}>
                승인 없이 바로 등록돼요.
              </div>
            );
            return (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--bg-secondary)", border: "1px solid var(--border)", fontSize: 13 }}>
                <span style={{ fontSize: 11.5, color: "var(--fg-muted)", display: "block", marginBottom: 2 }}>승인자</span>
                <span style={{ fontWeight: 600, color: "var(--fg)" }}>{name}</span>
                <span style={{ color: "var(--fg-muted)" }}>님이 이 휴가 신청을 승인해요.</span>
              </div>
            );
          })()}

          {error && <p style={{ fontSize: 12.5, color: "#dc2626", margin: 0 }}>{error}</p>}

          <button onClick={handleSubmit} disabled={isPending}
            style={{
              width: "100%", padding: "13px", borderRadius: 10, fontSize: 15, fontWeight: 700,
              background: isPending ? "var(--bg-tertiary)" : "var(--primary)",
              color: isPending ? "var(--fg-muted)" : "white",
              border: "none", cursor: isPending ? "wait" : "pointer",
            }}>
            {isPending ? "신청 중…" : "승인 요청하기"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── 카드 그리드 ─────────────────────────── */
export function LeaveTypeCards({
  leaveTypes,
  balances,
  approverCandidates,
}: {
  leaveTypes: LeaveTypeItem[];
  balances: LeaveBalanceSummary[];
  approverCandidates: { id: string; name: string }[];
}) {
  const [selected, setSelected] = useState<LeaveTypeItem | null>(null);
  const balanceMap = new Map(balances.map((b) => [b.leaveTypeId, b]));

  return (
    <>
      <div className="breakdown">
        <h3>휴가 등록</h3>
        <div className="types-grid">
          {leaveTypes.map((t) => {
            const balance = balanceMap.get(t.id);
            const isExhausted = balance && balance.remainingDays <= 0 && balance.grantedDays > 0;
            return (
              <button key={t.id} type="button" onClick={() => setSelected(t)}
                className={`type${isExhausted ? " na" : ""}`}
                style={{
                  textAlign: "left", cursor: "pointer",
                  border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px",
                  background: isExhausted ? "var(--bg-secondary)" : "var(--bg-primary)",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isExhausted) {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.borderColor = "var(--primary)"; el.style.boxShadow = "0 0 0 2px var(--primary-soft)";
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.borderColor = "var(--border)"; el.style.boxShadow = "none";
                }}
              >
                <div className="t">{t.name}</div>
                {balance && balance.grantedDays > 0 ? (
                  <>
                    <div className="vt num" style={{ color: isExhausted ? "var(--fg-subtle)" : undefined }}>
                      {balance.remainingDays}<small>/ {balance.grantedDays + balance.adjustedDays}일</small>
                    </div>
                    <div className="s">사용 {balance.usedDays}일</div>
                  </>
                ) : (
                  <div className="s" style={{ marginTop: 6, fontSize: 12, color: "var(--fg-muted)" }}>
                    {grantLabel(t, balance)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <Dialog open onOpenChange={(o) => { if (!o) setSelected(null); }}>
          <DialogContent className="max-w-md p-0 overflow-hidden">
            <RequestDialog leaveType={selected} approverCandidates={approverCandidates} onClose={() => setSelected(null)} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
