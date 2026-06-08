import Link from "next/link";
import { LeaveRequestEntry } from "./_components/leave-request-entry";
import { redirect } from "next/navigation";
import { getLeaveBalances, listLeaveTypes, listMyLeaveRequests, getAnnualLeaveLedger, getMyAnnualPolicyApprover, getMyLeavePromotions } from "@teamlet/modules/leave";
import { listApproverCandidates } from "@teamlet/modules/workflow";
import type { LeaveRequestItem } from "@teamlet/modules/leave";
import { auth } from "@/auth";

import { LeaveTabs } from "./_components/leave-tabs";
import { HistoryTab } from "./_components/history-tab";
import { AnnualDetailTab } from "./_components/annual-detail-tab";
import { AnnualPlanTab } from "./_components/annual-plan-tab";
import { LeaveTypeCards } from "./_components/leave-type-cards";

export const dynamic = "force-dynamic";

const VALID_TABS = ["overview", "detail", "plan", "history"] as const;
type TabId = (typeof VALID_TABS)[number];

const STATUS_CLS: Record<LeaveRequestItem["status"], string> = {
  DRAFT: "border-border bg-background-secondary text-foreground-subtle",
  PENDING: "border-amber-300 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-300 bg-emerald-50 text-emerald-700",
  REJECTED: "border-destructive bg-destructive-50 text-destructive",
  CANCELLED: "border-border bg-background-secondary text-foreground-subtle",
  CANCEL_PENDING: "border-amber-300 bg-amber-50 text-amber-700",
};
const STATUS_LABEL: Record<LeaveRequestItem["status"], string> = {
  DRAFT: "임시저장",
  PENDING: "대기 중",
  APPROVED: "승인",
  REJECTED: "반려",
  CANCELLED: "취소",
  CANCEL_PENDING: "취소 대기",
};

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

export default async function LeavePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const { tab, year: yearParam } = await searchParams;
  const activeTab: TabId = VALID_TABS.includes(tab as TabId) ? (tab as TabId) : "overview";

  const employeeId = session.user.employeeId;
  const currentYear = new Date().getFullYear();
  const year = yearParam ? parseInt(yearParam, 10) : currentYear;

  const [balancesResult, typesResult, requestsResult, approversResult, ledgerResult, annualPolicyApprover, promotionsResult] = await Promise.all([
    getLeaveBalances(employeeId, year),
    listLeaveTypes(employeeId),
    listMyLeaveRequests(employeeId),
    listApproverCandidates(employeeId),
    activeTab === "detail" ? getAnnualLeaveLedger(employeeId, year) : Promise.resolve(null),
    getMyAnnualPolicyApprover(employeeId),
    activeTab === "plan" ? getMyLeavePromotions(employeeId, year) : Promise.resolve(null),
  ]);

  const balances = balancesResult.ok ? balancesResult.data : [];
  const rawLeaveTypes = typesResult.ok ? typesResult.data : [];

  // 연차 타입에 정책 승인자 주입 (권한 불필요)
  // approveOnRegister=false(즉시 등록)이면 승인자 미주입 → 자동승인 처리
  const leaveTypes = rawLeaveTypes.map((t) =>
    t.key === "annual" && annualPolicyApprover.approverId && annualPolicyApprover.approveOnRegister
      ? { ...t, approverEmployeeId: annualPolicyApprover.approverId, approverName: annualPolicyApprover.approverName }
      : t
  );
  const requests = requestsResult.ok ? requestsResult.data : [];
  const approverCandidates = approversResult.ok ? approversResult.data : [];
  const ledger = ledgerResult?.ok ? ledgerResult.data : null;
  const promotions = promotionsResult?.ok ? promotionsResult.data : [];

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const annualBalance = balances.find((b) => b.leaveTypeKey === "annual");
  const totalGranted = balances.reduce((s, b) => s + b.grantedDays, 0);
  const totalUsed = balances.reduce((s, b) => s + b.usedDays, 0);
  const totalRemaining = balances.reduce((s, b) => s + b.remainingDays, 0);

  const annualTotal = annualBalance ? annualBalance.grantedDays + annualBalance.adjustedDays : 0;
  const usedPct = annualTotal > 0 ? Math.min(100, ((annualBalance?.usedDays ?? 0) / annualTotal) * 100) : 0;
  const scheduledPct = annualTotal > 0 ? Math.min(100 - usedPct, (pendingCount / annualTotal) * 100) : 0;

  return (
    <div className="page-body">
      {/* 페이지 헤더 */}
      <div className="page-h">
        <div>
          <h1 className="h-title">내 휴가</h1>
          <div className="h-sub">{year} 회계연도 · 1월 1일 ~ 12월 31일</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/leave?tab=history" className="btn btn-outline">사용 내역</Link>
          <LeaveRequestEntry
            leaveTypes={leaveTypes}
            balances={balances}
            approverCandidates={approverCandidates}
          />
        </div>
      </div>

      {/* 히어로 카드 — 진행바 내장 (디자인 lv-hero) */}
      {annualBalance && (
        <div className="lv-hero">
          <div>
            <div className="l">잔여 연차 — {year}년</div>
            <div className="v num">
              {annualBalance.remainingDays}
              <small>/ {annualTotal}일</small>
            </div>
            <div className="d">
              올해 부여 <b>{annualTotal}일</b> · 사용 <b>{annualBalance.usedDays}일</b>
              {pendingCount > 0 && <> · 대기 중 <b>{pendingCount}건</b></>}
            </div>
          </div>
          <div className="lv-hero-bar-wrap">
            <div className="lv-hero-bar">
              <i className="used" style={{ width: `${usedPct}%` }} />
              <i className="sch" style={{ width: `${scheduledPct}%` }} />
            </div>
            <div className="lv-hero-legend">
              <span><i className="u" />사용 {annualBalance.usedDays}</span>
              {pendingCount > 0 && <span><i className="s" />대기 {pendingCount}</span>}
              <span><i className="r" />잔여 {annualBalance.remainingDays}</span>
            </div>
          </div>
        </div>
      )}

      {/* 탭 */}
      <LeaveTabs activeTab={activeTab} pendingCount={pendingCount} year={year} />

      {/* 개요 탭 */}
      {activeTab === "overview" && (
        <>

          {/* 휴가 종류 카드 그리드 (클릭 → 신청 모달) */}
          <LeaveTypeCards
            leaveTypes={leaveTypes}
            balances={balances}
            approverCandidates={approverCandidates}
          />

          {/* 최근 신청 */}
          {requests.length > 0 && (
            <div className="breakdown">
              <h3>
                예정된 / 최근 신청
                <span className="sub">{requests.length}건</span>
              </h3>
              {requests.slice(0, 3).map((r) => (
                <div key={r.id} className="hist-row">
                  <div className="date">
                    <b>{fmtDate(r.startDate)}</b>
                    {r.startDate.toString() !== r.endDate.toString() && ` ~ ${fmtDate(r.endDate)}`}
                  </div>
                  <div className="desc">
                    <div className="t">{r.leaveTypeName}</div>
                    {r.reason && <div className="s">{r.reason}</div>}
                  </div>
                  <div className="dur">{r.days}일</div>
                  <div>
                    <span className={`st ${r.status === "APPROVED" ? "ok" : r.status === "PENDING" ? "wait" : r.status === "REJECTED" ? "rej" : "end"}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </div>
                </div>
              ))}
              {requests.length > 3 && (
                <div style={{ textAlign: "right", marginTop: "10px" }}>
                  <Link href="/leave?tab=history" className="btn btn-ghost sm">전체 보기 →</Link>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 연차 상세 탭 */}
      {activeTab === "detail" && (
        <AnnualDetailTab ledger={ledger} year={year} currentYear={currentYear} />
      )}

      {/* 연차 사용 계획 탭 (촉진 응답) */}
      {activeTab === "plan" && (
        <AnnualPlanTab promotions={promotions} year={year} currentYear={currentYear} />
      )}

      {/* 신청 이력 탭 */}
      {activeTab === "history" && (
        <HistoryTab requests={requests} />
      )}
    </div>
  );
}
