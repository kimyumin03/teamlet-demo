import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listCompanyLeaveBalances, listCompanyLeaveRequests, listLeaveTypes } from "@teamlet/modules/leave";
import { listEmployees } from "@teamlet/modules/employee";
import { GrantLeaveButton } from "@/components/hr/grant-leave-button";
import { ExpiryButton } from "@/components/hr/expiry-button";
import { BalanceTable } from "./_components/balance-table";
import { RequestsTable } from "./_components/requests-table";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "balances", label: "보유 현황" },
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

  const balances = balancesResult.ok ? balancesResult.data : null;
  const requests = requestsResult.ok ? requestsResult.data : null;
  const leaveTypes = typesResult.ok ? typesResult.data : [];
  const employees = employeesResult.ok
    ? employeesResult.data
        .filter((e) => e.isActive)
        .map((e) => ({ id: e.id, name: e.name, departmentName: e.departmentName }))
    : [];

  const noAccess = !balances && !requests;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">휴가 관리</h1>
          <p className="mt-0.5 text-sm text-foreground-muted">전 구성원의 휴가 보유 현황과 사용 내역을 관리해요</p>
        </div>
        {!noAccess && (
          <div className="flex items-center gap-2">
            <ExpiryButton year={year} />
            <GrantLeaveButton employees={employees} leaveTypes={leaveTypes} />
          </div>
        )}
      </header>

      {noAccess ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="text-sm font-medium text-foreground">휴가 관리 권한이 없어요</p>
          <p className="text-xs text-foreground-muted">
            <code className="rounded bg-background-secondary px-1 py-0.5">leave.balance.manage</code> 권한이 필요해요
          </p>
        </div>
      ) : (
        <>
          {/* 탭 */}
          <div className="mb-6 flex items-center justify-between border-b border-border">
            <div className="flex gap-1">
              {TABS.map((t) => (
                <Link
                  key={t.id}
                  href={`/hr/leave?tab=${t.id}${t.id === "balances" ? `&year=${year}` : ""}`}
                  className={`border-b-2 -mb-px px-4 py-2 text-sm transition-colors ${
                    activeTab === t.id
                      ? "border-foreground text-foreground font-medium"
                      : "border-transparent text-foreground-muted hover:text-foreground"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>

            {activeTab === "balances" && (
              <div className="flex items-center gap-1 pb-1">
                <Link
                  href={`/hr/leave?tab=balances&year=${year - 1}`}
                  className="rounded px-2 py-1 text-xs text-foreground-muted hover:bg-background-secondary"
                >
                  ‹
                </Link>
                <span className="text-sm font-medium text-foreground tabular-nums">{year}년</span>
                <Link
                  href={`/hr/leave?tab=balances&year=${year + 1}`}
                  className="rounded px-2 py-1 text-xs text-foreground-muted hover:bg-background-secondary"
                >
                  ›
                </Link>
              </div>
            )}
          </div>

          {activeTab === "balances" && balances && (
            <BalanceTable rows={balances} />
          )}
          {activeTab === "requests" && requests && (
            <RequestsTable requests={requests} />
          )}
          {(activeTab === "balances" && !balances) && (
            <p className="py-10 text-center text-sm text-foreground-muted">{balancesResult.ok ? "" : (balancesResult as { error: { message: string } }).error.message}</p>
          )}
        </>
      )}
    </div>
  );
}
