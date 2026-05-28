import Link from "next/link";
import { redirect } from "next/navigation";
import { getLeaveBalances, listLeaveTypes, listMyLeaveRequests } from "@teamlet/modules/leave";
import { listApproverCandidates } from "@teamlet/modules/workflow";
import type { LeaveRequestItem } from "@teamlet/modules/leave";
import { auth } from "@/auth";
import { LeaveRequestButton } from "@/components/leave/leave-request-button";
import { LeaveTabs } from "./_components/leave-tabs";
import { BalanceSection } from "./_components/balance-section";
import { HistoryTab } from "./_components/history-tab";

export const dynamic = "force-dynamic";

const VALID_TABS = ["overview", "history"] as const;
type TabId = (typeof VALID_TABS)[number];

const STATUS_CLS: Record<LeaveRequestItem["status"], string> = {
  DRAFT: "border-border bg-background-secondary text-foreground-subtle",
  PENDING: "border-amber-300 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-300 bg-emerald-50 text-emerald-700",
  REJECTED: "border-destructive bg-destructive-50 text-destructive",
  CANCELLED: "border-border bg-background-secondary text-foreground-subtle",
};
const STATUS_LABEL: Record<LeaveRequestItem["status"], string> = {
  DRAFT: "임시저장",
  PENDING: "대기 중",
  APPROVED: "승인",
  REJECTED: "반려",
  CANCELLED: "취소",
};

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

export default async function LeavePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const { tab } = await searchParams;
  const activeTab: TabId = VALID_TABS.includes(tab as TabId) ? (tab as TabId) : "overview";

  const employeeId = session.user.employeeId;
  const year = new Date().getFullYear();

  const [balancesResult, typesResult, requestsResult, approversResult] = await Promise.all([
    getLeaveBalances(employeeId, year),
    listLeaveTypes(employeeId),
    listMyLeaveRequests(employeeId),
    listApproverCandidates(employeeId),
  ]);

  const balances = balancesResult.ok ? balancesResult.data : [];
  const leaveTypes = typesResult.ok ? typesResult.data : [];
  const requests = requestsResult.ok ? requestsResult.data : [];
  const approverCandidates = approversResult.ok ? approversResult.data : [];

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const annualBalance = balances.find((b) => b.leaveTypeKey === "annual");
  const totalGranted = balances.reduce((s, b) => s + b.grantedDays, 0);
  const totalUsed = balances.reduce((s, b) => s + b.usedDays, 0);
  const totalRemaining = balances.reduce((s, b) => s + b.remainingDays, 0);

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="shrink-0 border-b border-border bg-background-primary px-6 py-4">
        <h1 className="text-[22px] font-bold leading-tight tracking-tight">내 휴가</h1>
        <p className="mt-0.5 text-[13px] text-foreground-muted">
          {year}년 · 총 {totalGranted}일 부여 · {totalUsed}일 사용 · {totalRemaining}일 잔여
        </p>
      </div>

      {/* 히어로 카드 */}
      {annualBalance && (() => {
        const annualTotal = annualBalance.grantedDays + annualBalance.adjustedDays;
        const usedPct = annualTotal > 0 ? Math.min(100, (annualBalance.usedDays / annualTotal) * 100) : 0;
        const isLow = annualBalance.remainingDays <= 3 && annualBalance.remainingDays > 0;
        const isExhausted = annualBalance.remainingDays <= 0 && annualTotal > 0;
        return (
          <div
            className="shrink-0 border-b border-border px-6 py-5"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-hover))" }}
          >
            <div className="grid grid-cols-[1fr_auto] items-center gap-6">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.72)" }}>
                  연차 잔여 — {year}년
                </p>
                <div className="mt-1 flex items-end gap-2">
                  <span
                    className={`text-[52px] font-extrabold leading-none tabular-nums tracking-tight ${
                      isExhausted ? "text-white/60" : "text-white"
                    }`}
                  >
                    {annualBalance.remainingDays}
                  </span>
                  <span className="mb-1.5 text-[18px] font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>
                    / {annualTotal}일
                  </span>
                </div>
                <p className="mt-1.5 text-[13px]" style={{ color: "rgba(255,255,255,0.85)" }}>
                  사용 <b className="text-white font-semibold">{annualBalance.usedDays}일</b>
                  {pendingCount > 0 && (
                    <> · 대기 중 <b className="text-white font-semibold">{pendingCount}건</b></>
                  )}
                  {isExhausted
                    ? " · 소진 완료"
                    : isLow
                    ? " · ⚠ 소진 임박"
                    : " · 소멸 임박 없음 ✓"}
                </p>
                {/* 분석 바 */}
                <div className="mt-3 h-[6px] w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${usedPct}%`, background: "rgba(255,255,255,0.85)" }}
                  />
                </div>
                <div className="mt-1.5 flex gap-4 text-[11.5px]" style={{ color: "rgba(255,255,255,0.65)" }}>
                  <span>
                    <span className="inline-block h-2 w-2 rounded-sm mr-1" style={{ background: "rgba(255,255,255,0.85)" }} />
                    사용 <b className="font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{annualBalance.usedDays}일</b>
                  </span>
                  <span>
                    <span className="inline-block h-2 w-2 rounded-sm mr-1" style={{ background: "rgba(255,255,255,0.2)" }} />
                    잔여 <b className="font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{annualBalance.remainingDays}일</b>
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <LeaveRequestButton leaveTypes={leaveTypes} approverCandidates={approverCandidates} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* 탭 */}
      <div className="shrink-0 border-b border-border px-6">
        <LeaveTabs activeTab={activeTab} pendingCount={pendingCount} />
      </div>

      {/* 개요 탭 */}
      {activeTab === "overview" && (
        <div className="flex-1 overflow-auto px-6 py-6">
          <BalanceSection balances={balances} year={year} />

          {requests.length > 0 && (
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-foreground-muted">
                  최근 신청
                </p>
                <Link
                  href="/leave?tab=history"
                  className="text-[12px] text-foreground-muted transition-colors hover:text-foreground"
                >
                  전체 보기 →
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {requests.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-4 rounded-[14px] border border-border bg-background-primary px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-semibold text-foreground">{r.leaveTypeName}</span>
                        <span className="font-mono text-[12px] tabular-nums text-foreground-muted">{r.days}일</span>
                      </div>
                      <p className="mt-0.5 text-[12px] text-foreground-muted">
                        {fmtDate(r.startDate)}
                        {r.startDate.toString() !== r.endDate.toString() && ` – ${fmtDate(r.endDate)}`}
                        {r.reason && <span className="ml-2 text-foreground-subtle">· {r.reason}</span>}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-[5px] border px-2 py-0.5 font-mono text-[11px] font-semibold ${STATUS_CLS[r.status]}`}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* 신청 내역 탭 */}
      {activeTab === "history" && (
        <div className="flex-1 overflow-auto px-6 py-6">
          <HistoryTab requests={requests} />
        </div>
      )}
    </div>
  );
}
