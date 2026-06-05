import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  listCompanyLeaveBalances,
  listCompanyLeaveRequests,
  listLeaveTypes,
  listMonthlyAnnualUsage,
  listCompanyLeavePromotions,
} from "@teamlet/modules/leave";
import { listEmployees } from "@teamlet/modules/employee";
import { listDepartments } from "@teamlet/modules/department";
import { GrantLeaveButton } from "@/components/hr/grant-leave-button";
import { AdjustLeaveButton } from "@/components/hr/adjust-leave-button";
import { GrantHistoryButton } from "@/components/hr/grant-history-button";
import { ExpiryButton } from "@/components/hr/expiry-button";
import { LeaveStatusView } from "./_components/leave-status-view";
import { RequestsTable } from "./_components/requests-table";
import { MonthlyAnnualTable } from "./_components/monthly-annual-table";
import { PromotionTable } from "./_components/promotion-table";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "balances", label: "휴가 보유 현황" },
  { id: "requests", label: "휴가 사용 내역" },
  { id: "monthly", label: "월별 연차" },
  { id: "promotion", label: "연차 촉진" },
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
  const activeTab: TabId =
    tab === "requests" ? "requests"
    : tab === "monthly" ? "monthly"
    : tab === "promotion" ? "promotion"
    : "balances";
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
  const employeeId = session.user.employeeId;

  const [balancesResult, requestsResult, typesResult, employeesResult, monthlyResult, promotionResult, departmentsResult] =
    await Promise.all([
      listCompanyLeaveBalances(employeeId, year),
      listCompanyLeaveRequests(employeeId),
      listLeaveTypes(employeeId),
      listEmployees(employeeId),
      listMonthlyAnnualUsage(employeeId, year),
      listCompanyLeavePromotions(employeeId, year),
      listDepartments(employeeId),
    ]);

  const rows = balancesResult.ok ? balancesResult.data : [];
  const requests = requestsResult.ok ? requestsResult.data : null;
  const leaveTypes = typesResult.ok ? typesResult.data : [];
  const employees = employeesResult.ok
    ? employeesResult.data
        .filter((e) => e.isActive)
        .map((e) => ({ id: e.id, name: e.name, departmentId: e.departmentId, departmentName: e.departmentName }))
    : [];
  const departments = departmentsResult.ok
    ? departmentsResult.data.map((d) => ({ id: d.id, name: d.name, parentId: d.parentId }))
    : [];
  const monthlyRows = monthlyResult.ok ? monthlyResult.data : [];
  const promotions = promotionResult.ok ? promotionResult.data : [];

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

  if (noAccess) {
    return (
      <div className="page-body">
        <div className="page-h">
          <div>
            <h1 className="h-title">휴가 관리</h1>
            <div className="h-sub">권한이 없어요</div>
          </div>
        </div>
        <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--fg-muted)" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--fg)", marginBottom: "8px" }}>휴가 관리 권한이 없어요</div>
          <code style={{ fontSize: "11.5px", background: "var(--bg-secondary)", padding: "2px 6px", borderRadius: "5px" }}>
            leave.balance.manage
          </code>{" "}
          권한이 필요해요
        </div>
      </div>
    );
  }

  const showYearNav = activeTab === "balances" || activeTab === "monthly";
  const activePromoCount = promotions.filter(
    (p) => p.status === "REQUESTED" || p.status === "ADMIN_WRITING" || p.status === "APPROVAL_PENDING",
  ).length;

  return (
    <div className="page-body">
      {/* 헤더 */}
      <div className="page-h">
        <div>
          <h1 className="h-title">휴가 관리</h1>
          <div className="h-sub">
            전 구성원 {rows.length}명 · 평균 잔여 {avgRemaining}일
            {nearExpiryCount > 0 && ` · 소진 임박 ${nearExpiryCount}명`}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <ExpiryButton year={year} />
          <GrantHistoryButton year={year} />
          <AdjustLeaveButton employees={employees} departments={departments} leaveTypes={leaveTypes} />
          <GrantLeaveButton employees={employees} departments={departments} leaveTypes={leaveTypes} />
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="kpis">
        <div className="kpi">
          <span className="lbl">전체 평균 잔여</span>
          <span className="val num">{avgRemaining}<small>일</small></span>
          <span className="delta">{exhaustedCount > 0 ? `소진 ${exhaustedCount}명 포함` : "연차 기준"}</span>
        </div>
        <div className={`kpi${nearExpiryCount > 0 ? " cta" : ""}`}>
          <span className="lbl">소진 임박 (≤3일)</span>
          <span className="val num">{nearExpiryCount}<small>명</small></span>
          <span className="delta">{exhaustedCount > 0 ? `소진 ${exhaustedCount}명` : "촉진 필요"}</span>
        </div>
        <div className="kpi">
          <span className="lbl">이번 달 사용</span>
          <span className="val num">{thisMonthDays}<small>일</small></span>
          <span className="delta">{now.getMonth() + 1}월 승인 기준</span>
        </div>
        <div className="kpi">
          <span className="lbl">오늘 휴가 중</span>
          <span className="val num">{onLeaveToday}<small>명</small></span>
          <span className="delta">{onLeaveToday > 0 ? "오늘 휴가 중인 구성원" : "오늘 휴가 없음"}</span>
        </div>
      </div>

      {/* 탭 + 연도 내비 */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
        <div className="tabs" style={{ margin: 0 }}>
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={`/hr/leave?tab=${t.id}${showYearNav ? `&year=${year}` : ""}`}
              className={`tab${activeTab === t.id ? " active" : ""}`}
            >
              {t.label}
              {t.id === "promotion" && activePromoCount > 0 && (
                <span style={{ marginLeft: "5px", fontSize: "11px", background: "var(--primary)",
                  color: "#fff", borderRadius: "99px", padding: "1px 6px", fontVariantNumeric: "tabular-nums" }}>
                  {activePromoCount}
                </span>
              )}
            </Link>
          ))}
        </div>
        {showYearNav && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
            <Link href={`/hr/leave?tab=${activeTab}&year=${year - 1}`} className="btn btn-ghost sm">‹</Link>
            <span style={{ fontSize: "13px", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{year}년</span>
            <Link href={`/hr/leave?tab=${activeTab}&year=${year + 1}`} className="btn btn-ghost sm">›</Link>
          </div>
        )}
      </div>

      {/* 콘텐츠 */}
      {activeTab === "balances" && rows.length > 0 && (
        <LeaveStatusView rows={rows} leaveTypes={leaveTypes} />
      )}
      {activeTab === "balances" && rows.length === 0 && (
        <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "14px", color: "var(--fg-muted)" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--fg)", marginBottom: "6px" }}>구성원 데이터가 없어요</div>
          <div style={{ fontSize: "12.5px" }}>활성 구성원과 휴가 유형을 먼저 설정해 주세요</div>
        </div>
      )}
      {activeTab === "requests" && requests && (
        <RequestsTable requests={requests} />
      )}
      {activeTab === "monthly" && (
        <MonthlyAnnualTable rows={monthlyRows} />
      )}
      {activeTab === "promotion" && (
        <PromotionTable promotions={promotions} />
      )}
    </div>
  );
}
