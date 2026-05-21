import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { listDepartments } from "@teamlet/modules/department";
import { listEmployees, type EmployeeListItem } from "@teamlet/modules/employee";
import { listPositions } from "@teamlet/modules/position";
import { EmptyState } from "@teamlet/ui";
import { UsersRound } from "lucide-react";
import { auth } from "@/auth";
import { AddDepartmentButton } from "@/components/members/add-department-button";
import { AddMemberButton } from "@/components/members/add-member-button";
import { AddPositionButton } from "@/components/members/add-position-button";
import { DepartmentActions } from "@/components/members/department-actions";
import { DepartmentSidebar } from "@/components/members/department-sidebar";
import { MemberSearchInput } from "@/components/members/search-input";
import { StatusTabs } from "@/components/members/status-tabs";

const UNASSIGNED = "__none__";

/**
 * 구성원 디렉토리 (docs/06 §2). P2 1단계 — read 전용 리스트.
 * 검색 / 필터 / 부서 / 직책 / 추가 흐름은 다음 단계.
 */
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<EmployeeListItem["employmentStatus"], string> = {
  ACTIVE: "재직",
  PROBATION: "수습",
  ON_LEAVE: "휴직",
  SECONDED: "파견",
  RESIGNED: "퇴직",
  SCHEDULED: "입사 예정",
};

const STATUS_CLASS: Record<EmployeeListItem["employmentStatus"], string> = {
  ACTIVE: "bg-background-secondary text-foreground-muted",
  PROBATION: "bg-amber-50 text-amber-700",
  ON_LEAVE: "bg-background-secondary text-foreground-subtle",
  SECONDED: "bg-blue-50 text-blue-700",
  RESIGNED: "bg-background-secondary text-foreground-subtle line-through",
  SCHEDULED: "bg-blue-50 text-blue-700",
};

function formatHireDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

const ACTIVE_STATUSES = new Set(["ACTIVE", "PROBATION", "ON_LEAVE", "SECONDED", "SCHEDULED"]);

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string; q?: string; status?: string; empType?: string }>;
}) {
  const params = await searchParams;
  const selected = params.department ?? null;
  const query = (params.q ?? "").trim().toLowerCase();
  const statusFilter = params.status ?? "";
  const empTypeFilter = params.empType ?? "";

  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const [employeesResult, departmentsResult, positionsResult] =
    await Promise.all([
      listEmployees(session.user.employeeId),
      listDepartments(session.user.employeeId),
      listPositions(session.user.employeeId),
    ]);

  if (!employeesResult.ok) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-foreground">구성원</h1>
        <p
          role="alert"
          className="mt-6 rounded-md bg-destructive-50 px-4 py-3 text-sm text-destructive-700"
        >
          {employeesResult.error.message}
        </p>
      </div>
    );
  }

  const allEmployees = employeesResult.data;
  const departments = departmentsResult.ok ? departmentsResult.data : [];
  const positions = positionsResult.ok ? positionsResult.data : [];

  const unassignedCount = allEmployees.filter((e) => !e.departmentId).length;

  // tab counts (before dept/query filter)
  const tabCounts = {
    "": allEmployees.length,
    active: allEmployees.filter((e) => ACTIVE_STATUSES.has(e.employmentStatus)).length,
    resigned: allEmployees.filter((e) => e.employmentStatus === "RESIGNED").length,
  };

  const filtered = allEmployees.filter((e) => {
    if (selected === UNASSIGNED && e.departmentId) return false;
    if (selected && selected !== UNASSIGNED && e.departmentId !== selected) return false;
    if (statusFilter === "active" && !ACTIVE_STATUSES.has(e.employmentStatus)) return false;
    if (statusFilter === "resigned" && e.employmentStatus !== "RESIGNED") return false;
    if (empTypeFilter && e.employmentType !== empTypeFilter) return false;
    if (!query) return true;
    return (
      e.name.toLowerCase().includes(query) ||
      (e.employeeNumber?.toLowerCase().includes(query) ?? false) ||
      (e.companyEmail?.toLowerCase().includes(query) ?? false)
    );
  });

  const selectedLabel =
    selected === null
      ? "전체"
      : selected === UNASSIGNED
        ? "미배정"
        : (departments.find((d) => d.id === selected)?.name ?? "부서");

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">구성원</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {selectedLabel} · {filtered.length}명
            {query && (
              <span className="ml-2 text-foreground-subtle">
                "{query}" 검색 결과
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-56">
            <MemberSearchInput initialValue={query} />
          </div>
          <AddPositionButton />
          <AddDepartmentButton departments={departments} />
          <AddMemberButton
            departments={departments}
            positions={positions}
            defaultDepartmentId={
              selected && selected !== UNASSIGNED ? selected : null
            }
          />
        </div>
      </header>

      <div className="mb-4">
        <Suspense>
          <StatusTabs counts={tabCounts} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
        <aside className="md:sticky md:top-12 md:self-start">
          <DepartmentSidebar
            departments={departments}
            selected={selected}
            totalCount={allEmployees.length}
            unassignedCount={unassignedCount}
          />
        </aside>

        <main>
          {selected && selected !== UNASSIGNED && (
            <div className="mb-3 flex items-center justify-end">
              <DepartmentActions
                departmentId={selected}
                departmentName={selectedLabel}
              />
            </div>
          )}
          {filtered.length === 0 ? (
            <EmptyState
              icon={<UsersRound />}
              title={
                query
                  ? "검색 결과가 없어요"
                  : selected === null
                    ? "아직 등록된 구성원이 없어요"
                    : "이 부서에 구성원이 없어요"
              }
              description={
                query
                  ? "다른 키워드로 검색해 보세요."
                  : selected === null
                    ? "회사 신청 승인 시 신청자 본인이 첫 구성원으로 등록돼요."
                    : "사이드바에서 다른 부서를 선택하거나 구성원을 추가해 보세요."
              }
            />
          ) : (
            <ul className="flex flex-col gap-1">
              {filtered.map((emp) => (
                <li key={emp.id}>
                  <Link
                    href={`/members/${emp.id}`}
                    className="grid grid-cols-[1.5fr_1fr_1fr_1fr_auto] items-center gap-4 rounded-lg border border-border bg-background-primary px-4 py-3 transition-colors hover:bg-background-secondary"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">
                        {emp.name}
                      </span>
                      {emp.companyEmail && (
                        <span className="text-sm text-foreground-muted">
                          {emp.companyEmail}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-foreground-muted">
                      {emp.departmentName ?? "—"}
                    </div>
                    <div className="text-sm text-foreground-muted">
                      {emp.employeeNumber ?? "—"}
                    </div>
                    <div className="text-sm text-foreground-muted">
                      {formatHireDate(emp.hireDate)}
                    </div>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs ${STATUS_CLASS[emp.employmentStatus]}`}
                    >
                      {STATUS_LABEL[emp.employmentStatus]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}
