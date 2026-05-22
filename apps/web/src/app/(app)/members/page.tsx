import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { listDepartments } from "@teamlet/modules/department";
import { listEmployees, type EmployeeListItem } from "@teamlet/modules/employee";
import { listPositions } from "@teamlet/modules/position";
import { auth } from "@/auth";
import { AddDepartmentButton } from "@/components/members/add-department-button";
import { AddMemberButton } from "@/components/members/add-member-button";
import { AddPositionButton } from "@/components/members/add-position-button";
import { CsvImportButton } from "@/components/members/csv-import-button";
import { DepartmentActions } from "@/components/members/department-actions";
import { DepartmentSidebar } from "@/components/members/department-sidebar";
import { MemberSearchInput } from "@/components/members/search-input";
import { StatusTabs } from "@/components/members/status-tabs";

export const dynamic = "force-dynamic";

const UNASSIGNED = "__none__";

const STATUS_LABEL: Record<EmployeeListItem["employmentStatus"], string> = {
  ACTIVE: "재직",
  PROBATION: "수습",
  ON_LEAVE: "휴직",
  SECONDED: "파견",
  RESIGNED: "퇴직",
  SCHEDULED: "입사예정",
};

const STATUS_DOT: Record<EmployeeListItem["employmentStatus"], string> = {
  ACTIVE: "bg-green-500",
  PROBATION: "bg-amber-400",
  ON_LEAVE: "bg-slate-400",
  SECONDED: "bg-blue-400",
  RESIGNED: "bg-slate-300",
  SCHEDULED: "bg-blue-400",
};

const STATUS_TEXT: Record<EmployeeListItem["employmentStatus"], string> = {
  ACTIVE: "text-green-700",
  PROBATION: "text-amber-700",
  ON_LEAVE: "text-slate-500",
  SECONDED: "text-blue-700",
  RESIGNED: "text-slate-400",
  SCHEDULED: "text-blue-700",
};

const EMP_TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "정규직",
  PART_TIME: "파트타임",
  CONTRACT: "계약직",
  INTERN: "인턴",
  DISPATCH: "파견",
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function getAvatarColor(name: string) {
  const code = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[code] ?? AVATAR_COLORS[0]!;
}

function formatHireDate(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
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

  const [employeesResult, departmentsResult, positionsResult] = await Promise.all([
    listEmployees(session.user.employeeId),
    listDepartments(session.user.employeeId),
    listPositions(session.user.employeeId),
  ]);

  if (!employeesResult.ok) {
    return (
      <div className="p-8">
        <p className="rounded-lg bg-destructive-50 px-4 py-3 text-sm text-destructive-700">
          {employeesResult.error.message}
        </p>
      </div>
    );
  }

  const allEmployees = employeesResult.data;
  const departments = departmentsResult.ok ? departmentsResult.data : [];
  const positions = positionsResult.ok ? positionsResult.data : [];
  const unassignedCount = allEmployees.filter((e) => !e.departmentId).length;

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

  const selectedDeptName =
    selected === null ? "전체"
    : selected === UNASSIGNED ? "미배정"
    : (departments.find((d) => d.id === selected)?.name ?? "부서");

  return (
    <div className="flex h-full flex-col">
      {/* 페이지 헤더 */}
      <div className="border-b border-border bg-background-primary px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">구성원</h1>
            <p className="mt-0.5 text-sm text-foreground-subtle">
              {selectedDeptName} · <span className="font-medium text-foreground">{filtered.length}명</span>
              {query && <span className="ml-1.5 text-foreground-subtle">"{query}" 검색</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-60">
              <MemberSearchInput initialValue={query} />
            </div>
            <a
              href="/api/members/export"
              download
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background-primary px-3 text-xs text-foreground-muted hover:bg-background-secondary transition-colors"
            >
              CSV 내보내기
            </a>
            <CsvImportButton />
            <AddPositionButton />
            <AddDepartmentButton departments={departments} />
            <AddMemberButton
              departments={departments}
              positions={positions}
              defaultDepartmentId={selected && selected !== UNASSIGNED ? selected : null}
            />
          </div>
        </div>

        {/* 상태 탭 */}
        <div className="mt-3">
          <Suspense>
            <StatusTabs counts={tabCounts} />
          </Suspense>
        </div>
      </div>

      {/* 본문: 부서 사이드바 + 테이블 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 부서 트리 */}
        <aside className="w-52 shrink-0 overflow-y-auto border-r border-border bg-background-primary py-2">
          <DepartmentSidebar
            departments={departments}
            selected={selected}
            totalCount={allEmployees.length}
            unassignedCount={unassignedCount}
          />
        </aside>

        {/* 구성원 테이블 */}
        <div className="flex-1 overflow-auto">
          {selected && selected !== UNASSIGNED && (
            <div className="flex items-center justify-end border-b border-border px-4 py-2">
              <DepartmentActions departmentId={selected} departmentName={selectedDeptName} />
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background-secondary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6 text-foreground-subtle">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {query ? "검색 결과가 없어요" : selected === null ? "등록된 구성원이 없어요" : "이 부서에 구성원이 없어요"}
                </p>
                <p className="mt-1 text-xs text-foreground-subtle">
                  {query ? "다른 키워드로 검색해 보세요." : "우측 상단 '구성원 추가'로 등록할 수 있어요."}
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background-primary text-left">
                  <th className="px-4 py-2.5 text-xs font-medium text-foreground-subtle">이름</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-foreground-subtle">부서 · 직책</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-foreground-subtle">고용형태</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-foreground-subtle">사번</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-foreground-subtle">입사일</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-foreground-subtle">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    className={`group transition-colors hover:bg-background-secondary ${emp.employmentStatus === "RESIGNED" ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/members/${emp.id}`} className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(emp.name)}`}>
                          {emp.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground group-hover:text-primary truncate">{emp.name}</p>
                          {emp.companyEmail && (
                            <p className="text-xs text-foreground-subtle truncate">{emp.companyEmail}</p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/members/${emp.id}`} className="block">
                        <p className="text-foreground-muted">{emp.departmentName ?? <span className="text-foreground-subtle">—</span>}</p>
                        {emp.positionName && (
                          <p className="text-xs text-foreground-subtle">{emp.positionName}</p>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">
                      <Link href={`/members/${emp.id}`} className="block">
                        {EMP_TYPE_LABEL[emp.employmentType] ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted font-mono text-xs">
                      <Link href={`/members/${emp.id}`} className="block">
                        {emp.employeeNumber ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">
                      <Link href={`/members/${emp.id}`} className="block">
                        {formatHireDate(emp.hireDate)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/members/${emp.id}`} className="block">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${STATUS_TEXT[emp.employmentStatus]}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[emp.employmentStatus]}`} />
                          {STATUS_LABEL[emp.employmentStatus]}
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
