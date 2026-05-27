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

const VALID_TABS = ["dashboard", "history"] as const;
type TabId = (typeof VALID_TABS)[number];

const STATUS_CLASS: Record<LeaveRequestItem["status"], string> = {
  DRAFT: "bg-background-secondary text-foreground-subtle",
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-background-secondary text-foreground-muted",
  REJECTED: "bg-destructive-50 text-destructive-700",
  CANCELLED: "bg-background-secondary text-foreground-subtle",
};
const STATUS_LABEL: Record<LeaveRequestItem["status"], string> = {
  DRAFT: "임시저장",
  PENDING: "대기 중",
  APPROVED: "승인",
  REJECTED: "반려",
  CANCELLED: "취소",
};

function fmtShort(d: Date) {
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
  const activeTab: TabId = VALID_TABS.includes(tab as TabId) ? (tab as TabId) : "dashboard";

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

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* 헤더 */}
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">내 휴가</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {year}년 휴가 현황을 확인하고 신청해요.
          </p>
        </div>
        <LeaveRequestButton leaveTypes={leaveTypes} approverCandidates={approverCandidates} />
      </header>

      {/* 탭 */}
      <LeaveTabs activeTab={activeTab} pendingCount={pendingCount} />

      {/* 대시보드 탭 */}
      {activeTab === "dashboard" && (
        <>
          <BalanceSection balances={balances} year={year} />

          {requests.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-foreground-muted">최근 신청</h2>
                <Link
                  href="/leave?tab=history"
                  className="text-xs text-foreground-muted hover:text-foreground"
                >
                  전체 보기 →
                </Link>
              </div>
              <ul className="flex flex-col gap-2">
                {requests.slice(0, 3).map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background-primary px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {r.leaveTypeName}
                        </span>
                        <span className="tabular-nums text-sm text-foreground-muted">
                          {r.days}일
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-foreground-muted">
                        {fmtShort(r.startDate)}
                        {r.startDate.toString() !== r.endDate.toString() &&
                          ` – ${fmtShort(r.endDate)}`}
                        {r.reason && (
                          <span className="ml-2 text-foreground-subtle">· {r.reason}</span>
                        )}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[r.status]}`}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* 신청 내역 탭 */}
      {activeTab === "history" && <HistoryTab requests={requests} />}
    </div>
  );
}
