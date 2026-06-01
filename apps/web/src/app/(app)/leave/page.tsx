import Link from "next/link";
import { redirect } from "next/navigation";
import { getLeaveBalances, listLeaveTypes, listMyLeaveRequests, getAnnualLeaveLedger, getMyAnnualPolicyApprover } from "@teamlet/modules/leave";
import { listApproverCandidates } from "@teamlet/modules/workflow";
import type { LeaveRequestItem } from "@teamlet/modules/leave";
import { auth } from "@/auth";

import { LeaveTabs } from "./_components/leave-tabs";
import { HistoryTab } from "./_components/history-tab";
import { AnnualDetailTab } from "./_components/annual-detail-tab";
import { LeaveTypeCards } from "./_components/leave-type-cards";

export const dynamic = "force-dynamic";

const VALID_TABS = ["overview", "detail", "history"] as const;
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

  const [balancesResult, typesResult, requestsResult, approversResult, ledgerResult, annualPolicyApprover] = await Promise.all([
    getLeaveBalances(employeeId, year),
    listLeaveTypes(employeeId),
    listMyLeaveRequests(employeeId),
    listApproverCandidates(employeeId),
    activeTab === "detail" ? getAnnualLeaveLedger(employeeId, year) : Promise.resolve(null),
    getMyAnnualPolicyApprover(employeeId),
  ]);

  const balances = balancesResult.ok ? balancesResult.data : [];
  const rawLeaveTypes = typesResult.ok ? typesResult.data : [];

  // 연차 타입에 정책 승인자 주입 (권한 불필요)
  const leaveTypes = rawLeaveTypes.map((t) =>
    t.key === "annual" && annualPolicyApprover.approverId
      ? { ...t, approverEmployeeId: annualPolicyApprover.approverId, approverName: annualPolicyApprover.approverName }
      : t
  );
  const requests = requestsResult.ok ? requestsResult.data : [];
  const approverCandidates = approversResult.ok ? approversResult.data : [];
  const ledger = ledgerResult?.ok ? ledgerResult.data : null;

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
          <div className="h-sub">{year}년 · 총 {totalGranted}일 부여 · 사용 {totalUsed}일 · 잔여 {totalRemaining}일</div>
        </div>
        <div />
      </div>

      {/* 히어로 카드 */}
      {annualBalance && (
        <div className="lv-hero">
          <div>
            <div className="l">연차 잔여 — {year}년</div>
            <div className="v num">
              {annualBalance.remainingDays}
              <small>/ {annualTotal}일</small>
            </div>
            <div className="d">
              사용 <b>{annualBalance.usedDays}일</b>
              {pendingCount > 0 && <> · 대기 중 <b>{pendingCount}건</b></>}
              {annualBalance.remainingDays <= 0 ? " · 소진 완료" : annualBalance.remainingDays <= 3 ? " · ⚠ 소진 임박" : " · 소멸 임박 없음 ✓"}
            </div>
          </div>
          <div className="actions" />
        </div>
      )}

      {/* 탭 */}
      <LeaveTabs activeTab={activeTab} pendingCount={pendingCount} year={year} />

      {/* 개요 탭 */}
      {activeTab === "overview" && (
        <>
          {/* 연간 사용 현황 바 */}
          {annualBalance && (
            <div className="breakdown">
              <h3>연간 사용 현황 <span className="sub">{year}. 1. 1 — {year}. 12. 31</span></h3>
              <div className="bd-bar">
                <div className="seg used" style={{ width: `${usedPct}%` }} />
                <div className="seg scheduled" style={{ width: `${scheduledPct}%` }} />
              </div>
              <div className="bd-legend">
                <span className="used"><i />사용 <b>{annualBalance.usedDays}일</b></span>
                {pendingCount > 0 && <span className="scheduled"><i />대기 중 <b>{pendingCount}건</b></span>}
                <span className="remaining"><i />잔여 <b>{annualBalance.remainingDays}일</b></span>
              </div>
            </div>
          )}

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
              {requests.slice(0, 5).map((r) => (
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
              {requests.length > 5 && (
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

      {/* 신청 이력 탭 */}
      {activeTab === "history" && (
        <HistoryTab requests={requests} />
      )}
    </div>
  );
}
