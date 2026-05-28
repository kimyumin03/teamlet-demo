import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listCompanyLeaveBalances, listCompanyLeaveRequests, listLeaveTypes } from "@teamlet/modules/leave";
import { listEmployees } from "@teamlet/modules/employee";
import { GrantLeaveButton } from "@/components/hr/grant-leave-button";
import { ExpiryButton } from "@/components/hr/expiry-button";
import { LeaveStatusView } from "./_components/leave-status-view";
import { RequestsTable } from "./_components/requests-table";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "balances", label: "현황" },
  { id: "requests", label: "사용 내역" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default async function HrLeavePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const { tab, year: yearParam } = await searchParams;
  const activeTab: TabId = tab === "requests" ? "requests" : "balances";
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
  const employeeId = session.user.employeeId;

  const [balancesResult, requestsResult, typesResult, employeesResult] = await Promise.all([
    listCompanyLeaveBalances(employeeId, year),
    listCompanyLeaveRequests(employeeId),
    listLeaveTypes(employeeId),
    listEmployees(employeeId),
  ]);

  const rows = balancesResult.ok ? balancesResult.data : [];
  const requests = requestsResult.ok ? requestsResult.data : null;
  const leaveTypes = typesResult.ok ? typesResult.data : [];
  const employees = employeesResult.ok
    ? employeesResult.data
        .filter((e) => e.isActive)
        .map((e) => ({ id: e.id, name: e.name, departmentName: e.departmentName }))
    : [];

  const noAccess = !balancesResult.ok && !requestsResult.ok;

  // KPI 계산
  const annualBalances = rows
    .map((r) => r.balances.find((b) => b.leaveTypeKey === "annual"))
    .filter(Boolean);
  const avgRemaining =
    annualBalances.length > 0
      ? Math.round((annualBalances.reduce((s, b) => s + b!.remainingDays, 0) / annualBalances.length) * 10) / 10
      : 0;
  const nearExpiryCount = annualBalances.filter((b) => b!.remainingDays <= 3 && b!.remainingDays > 0).length;
  const exhaustedCount = annualBalances.filter((b) => b!.remainingDays <= 0 && b!.grantedDays > 0).length;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonthDays = requests
    ? requests
        .filter((r) => {
          if (r.status !== "APPROVED") return false;
          const d = new Date(r.startDate);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((s, r) => s + r.days, 0)
    : 0;
  const onLeaveToday = requests
    ? requests.filter((r) => {
        if (r.status !== "APPROVED") return false;
        const start = new Date(r.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(r.endDate);
        end.setHours(23, 59, 59, 999);
        return start <= today && end >= today;
      }).length
    : 0;

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="shrink-0 border-b border-border bg-background-primary px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight">휴가 관리</h1>
            <p className="mt-0.5 text-[13px] text-foreground-muted">
              전 구성원 {rows.length}명 · 평균 잔여 {avgRemaining}일
              {nearExpiryCount > 0 && ` · 소진 임박 ${nearExpiryCount}명`}
            </p>
          </div>
          {!noAccess && (
            <div className="flex items-center gap-2">
              <ExpiryButton year={year} />
              <GrantLeaveButton employees={employees} leaveTypes={leaveTypes} />
            </div>
          )}
        </div>
      </div>

      {noAccess ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="text-[14px] font-medium text-foreground">휴가 관리 권한이 없어요</p>
          <p className="text-[12.5px] text-foreground-muted">
            <code className="rounded bg-background-secondary px-1 py-0.5 text-[11.5px]">leave.balance.manage</code> 권한이 필요해요
          </p>
        </div>
      ) : (
        <>
          {/* KPI 카드 */}
          <div className="shrink-0 grid grid-cols-4 gap-3 border-b border-border px-6 py-4">
            <div className="rounded-[14px] border border-border bg-background-primary px-4 py-3">
              <p className="text-[12px] text-foreground-muted">전사 평균 잔여</p>
              <p className="mt-1 text-[22px] font-bold tabular-nums leading-tight">
                {avgRemaining}<small className="ml-1 text-[12px] font-normal text-foreground-muted">일</small>
              </p>
              <p className="mt-0.5 text-[11.5px] text-foreground-subtle">
                {exhaustedCount > 0 ? `소진 ${exhaustedCount}명 포함` : "연차 기준"}
              </p>
            </div>
            <div className={`rounded-[14px] border px-4 py-3 ${nearExpiryCount > 0 ? "border-amber-200 bg-amber-50/40" : "border-border bg-background-primary"}`}>
              <p className="text-[12px] text-foreground-muted">소진 임박 (≤3일)</p>
              <p className={`mt-1 text-[22px] font-bold tabular-nums leading-tight ${nearExpiryCount > 0 ? "text-amber-700" : "text-foreground"}`}>
                {nearExpiryCount}<small className="ml-1 text-[12px] font-normal text-foreground-muted">명</small>
              </p>
              <p className="mt-0.5 text-[11.5px] text-foreground-subtle">
                {exhaustedCount > 0 ? `소진 ${exhaustedCount}명` : "연차 잔여 기준"}
              </p>
            </div>
            <div className="rounded-[14px] border border-border bg-background-primary px-4 py-3">
              <p className="text-[12px] text-foreground-muted">이번 달 사용</p>
              <p className="mt-1 text-[22px] font-bold tabular-nums leading-tight">
                {thisMonthDays}<small className="ml-1 text-[12px] font-normal text-foreground-muted">일</small>
              </p>
              <p className="mt-0.5 text-[11.5px] text-foreground-subtle">
                {now.getMonth() + 1}월 승인 기준
              </p>
            </div>
            <div className={`rounded-[14px] border px-4 py-3 ${onLeaveToday > 0 ? "border-primary/20 bg-primary/5" : "border-border bg-background-primary"}`}>
              <p className="text-[12px] text-foreground-muted">오늘 휴가 중</p>
              <p className="mt-1 text-[22px] font-bold tabular-nums leading-tight text-foreground">
                {onLeaveToday}<small className="ml-1 text-[12px] font-normal text-foreground-muted">명</small>
              </p>
              <p className="mt-0.5 text-[11.5px] text-foreground-subtle">
                {onLeaveToday > 0 ? "오늘 휴가 중인 구성원" : "오늘 휴가 없음"}
              </p>
            </div>
          </div>

          {/* 탭 */}
          <div className="shrink-0 flex items-center justify-between border-b border-border px-6">
            <div className="flex gap-0">
              {TABS.map((t) => (
                <Link
                  key={t.id}
                  href={`/hr/leave?tab=${t.id}${t.id === "balances" ? `&year=${year}` : ""}`}
                  className={`border-b-2 -mb-px px-4 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === t.id
                      ? "border-foreground text-foreground"
                      : "border-transparent text-foreground-muted hover:text-foreground hover:border-border"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
            {activeTab === "balances" && (
              <div className="flex items-center gap-1 py-2">
                <Link
                  href={`/hr/leave?tab=balances&year=${year - 1}`}
                  className="rounded px-2 py-1 text-xs text-foreground-muted hover:bg-background-secondary"
                >
                  ‹
                </Link>
                <span className="text-sm font-medium tabular-nums text-foreground">{year}년</span>
                <Link
                  href={`/hr/leave?tab=balances&year=${year + 1}`}
                  className="rounded px-2 py-1 text-xs text-foreground-muted hover:bg-background-secondary"
                >
                  ›
                </Link>
              </div>
            )}
          </div>

          {/* 컨텐츠 */}
          {activeTab === "balances" && rows.length > 0 && (
            <LeaveStatusView rows={rows} leaveTypes={leaveTypes} />
          )}
          {activeTab === "balances" && rows.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <p className="text-[14px] font-medium text-foreground">구성원 데이터가 없어요</p>
              <p className="text-[12.5px] text-foreground-muted">활성 구성원과 휴가 유형을 먼저 설정해 주세요</p>
            </div>
          )}
          {activeTab === "requests" && requests && (
            <div className="flex-1 overflow-auto px-6 py-6">
              <RequestsTable requests={requests} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
