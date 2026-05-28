import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { listDepartments } from "@teamlet/modules/department";
import { listEmployees, type EmployeeListItem } from "@teamlet/modules/employee";
import { listPositions } from "@teamlet/modules/position";
import { listPendingMemberships } from "@teamlet/modules/tenancy";
import { auth } from "@/auth";
import { AddDepartmentButton } from "@/components/members/add-department-button";
import { AddMemberButton } from "@/components/members/add-member-button";
import { PendingJoinPanel } from "@/components/members/pending-join-panel";
import { AddPositionButton } from "@/components/members/add-position-button";
import { OrgTree } from "./org-chart/_components/org-tree";
import { MembersFilterBar } from "./_components/members-filter-bar";

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

const STATUS_BADGE: Record<EmployeeListItem["employmentStatus"], string> = {
  ACTIVE: "bg-emerald-50 border border-emerald-200 text-emerald-700",
  PROBATION: "bg-amber-50 border border-amber-200 text-amber-700",
  ON_LEAVE: "bg-background-secondary border border-border text-foreground-muted",
  SECONDED: "bg-blue-50 border border-blue-200 text-blue-700",
  RESIGNED: "bg-background-secondary border border-border text-foreground-subtle",
  SCHEDULED: "bg-blue-50 border border-blue-200 text-blue-700",
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
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]!;
}

function formatHireDate(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

const ACTIVE_STATUSES = new Set(["ACTIVE", "PROBATION", "ON_LEAVE", "SECONDED", "SCHEDULED"]);

function makeViewHref(
  params: { department?: string; q?: string; status?: string; empType?: string },
  view: string,
) {
  const sp = new URLSearchParams();
  if (params.department) sp.set("department", params.department);
  if (params.q) sp.set("q", params.q);
  if (params.status) sp.set("status", params.status);
  if (params.empType) sp.set("empType", params.empType);
  if (view !== "list") sp.set("view", view);
  const qs = sp.toString();
  return `/members${qs ? `?${qs}` : ""}`;
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string; q?: string; status?: string; empType?: string; view?: string }>;
}) {
  const params = await searchParams;
  const selected = params.department ?? null;
  const query = (params.q ?? "").trim().toLowerCase();
  const statusFilter = params.status ?? "";
  const empTypeFilter = params.empType ?? "";
  const view = params.view === "org" ? "org" : "list";

  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const [employeesResult, departmentsResult, positionsResult, pendingResult] = await Promise.all([
    listEmployees(session.user.employeeId),
    listDepartments(session.user.employeeId),
    listPositions(session.user.employeeId),
    listPendingMemberships(session.user.employeeId),
  ]);

  const pendingMembers = pendingResult.ok ? pendingResult.data : [];

  if (!employeesResult.ok) {
    return (
      <div className="p-8">
        <p className="rounded-[14px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">
          {employeesResult.error.message}
        </p>
      </div>
    );
  }

  const allEmployees = employeesResult.data;
  const departments = departmentsResult.ok ? departmentsResult.data : [];
  const positions = positionsResult.ok ? positionsResult.data : [];

  // KPI stats
  const employedCount = allEmployees.filter(
    (e) => e.employmentStatus === "ACTIVE" || e.employmentStatus === "PROBATION" || e.employmentStatus === "SECONDED",
  ).length;
  const onLeaveCount = allEmployees.filter((e) => e.employmentStatus === "ON_LEAVE").length;
  const scheduledCount = allEmployees.filter((e) => e.employmentStatus === "SCHEDULED").length;
  const fullTimeCount = allEmployees.filter(
    (e) => (e.employmentStatus === "ACTIVE" || e.employmentStatus === "PROBATION") && e.employmentType === "FULL_TIME",
  ).length;
  const contractCount = allEmployees.filter(
    (e) => (e.employmentStatus === "ACTIVE" || e.employmentStatus === "PROBATION") && e.employmentType === "CONTRACT",
  ).length;
  const now = new Date();
  const newHiresCount = allEmployees.filter((e) => {
    if (!e.hireDate) return false;
    const d = new Date(e.hireDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

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

  const orgEmployees = allEmployees.filter(
    (e) => e.isActive && e.employmentStatus !== "RESIGNED",
  );

  const listHref = makeViewHref(params, "list");
  const orgHref = makeViewHref(params, "org");

  return (
    <div className="flex h-full flex-col">
      {pendingMembers.length > 0 && <PendingJoinPanel items={pendingMembers} />}

      {/* 페이지 헤더 */}
      <div className="shrink-0 border-b border-border bg-background-primary px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight">구성원</h1>
            <p className="mt-0.5 text-[13px] text-foreground-muted">
              전체 {allEmployees.length}명
              {employedCount > 0 && <span className="ml-2">재직 {employedCount}</span>}
              {onLeaveCount > 0 && <span className="ml-2">휴직 {onLeaveCount}</span>}
              {scheduledCount > 0 && <span className="ml-2">입사예정 {scheduledCount}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* 뷰 토글 */}
            <div className="flex items-center rounded-lg bg-background-secondary p-0.5 gap-0.5">
              <Link
                href={listHref}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                  view === "list"
                    ? "bg-background-primary text-foreground shadow-sm"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
                리스트
              </Link>
              <Link
                href={orgHref}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                  view === "org"
                    ? "bg-background-primary text-foreground shadow-sm"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="9" y="3" width="6" height="5" rx="1" /><rect x="3" y="16" width="6" height="5" rx="1" />
                  <rect x="15" y="16" width="6" height="5" rx="1" /><path d="M12 8v4M6 16v-2h12v2" />
                </svg>
                조직도
              </Link>
            </div>

            <AddPositionButton />
            <AddDepartmentButton departments={departments} />
            <AddMemberButton
              departments={departments}
              positions={positions}
              defaultDepartmentId={selected && selected !== UNASSIGNED ? selected : null}
            />
          </div>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="shrink-0 grid grid-cols-3 gap-4 border-b border-border px-6 py-4">
        <div className="rounded-[14px] border border-border bg-background-primary px-4 py-3">
          <p className="text-[12px] text-foreground-muted">재직</p>
          <p className="mt-1 text-[22px] font-bold tabular-nums leading-tight">
            {employedCount}<small className="ml-1 text-[12px] font-normal text-foreground-muted">명</small>
          </p>
          <p className="mt-0.5 text-[11.5px] text-foreground-subtle">
            정규 {fullTimeCount} · 계약 {contractCount}
          </p>
        </div>
        <div className="rounded-[14px] border border-border bg-background-primary px-4 py-3">
          <p className="text-[12px] text-foreground-muted">이번달 입사</p>
          <p className="mt-1 text-[22px] font-bold tabular-nums leading-tight">
            {newHiresCount}<small className="ml-1 text-[12px] font-normal text-foreground-muted">명</small>
          </p>
          <p className="mt-0.5 text-[11.5px] text-foreground-subtle">
            {newHiresCount === 0 ? "이번달 신규 입사자 없음" : `${now.getMonth() + 1}월 입사`}
          </p>
        </div>
        <div className="rounded-[14px] border border-border bg-background-primary px-4 py-3">
          <p className="text-[12px] text-foreground-muted">휴직</p>
          <p className="mt-1 text-[22px] font-bold tabular-nums leading-tight">
            {onLeaveCount}<small className="ml-1 text-[12px] font-normal text-foreground-muted">명</small>
          </p>
          <p className="mt-0.5 text-[11.5px] text-foreground-subtle">
            {scheduledCount > 0 ? `입사예정 ${scheduledCount}명 포함` : "입사예정 없음"}
          </p>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="shrink-0 border-b border-border px-6 py-3">
        <Suspense>
          <MembersFilterBar
            departments={departments.map((d) => ({ id: d.id, name: d.name }))}
            initialQ={query}
          />
        </Suspense>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-auto">
        {view === "org" ? (
          <div className="px-6 py-6">
            {departments.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-20 text-center">
                <p className="text-[14px] font-medium text-foreground">등록된 부서가 없어요</p>
                <p className="text-[12.5px] text-foreground-muted">부서를 먼저 추가해 주세요.</p>
              </div>
            ) : (
              <OrgTree departments={departments} employees={orgEmployees} />
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background-secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6 text-foreground-subtle">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-medium text-foreground">
                {query ? "검색 결과가 없어요" : "구성원이 없어요"}
              </p>
              <p className="mt-1 text-[12.5px] text-foreground-muted">
                {query ? "다른 키워드로 검색해 보세요." : "우측 상단 '구성원 추가'로 등록할 수 있어요."}
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border bg-background-primary text-left">
                <th className="w-10 px-4 py-2.5">
                  <span className="inline-block h-4 w-4 rounded-[4px] border-[1.5px] border-border" />
                </th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-foreground-subtle">이름</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-foreground-subtle">사번</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-foreground-subtle">이메일</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-foreground-subtle">조직 · 직책</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-foreground-subtle">입사일</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-foreground-subtle">근로유형</th>
                <th className="px-4 py-2.5 text-[12px] font-medium text-foreground-subtle">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((emp) => (
                <tr
                  key={emp.id}
                  className={`group transition-colors hover:bg-background-secondary ${emp.employmentStatus === "RESIGNED" ? "opacity-50" : ""}`}
                >
                  <td className="w-10 px-4 py-3">
                    <span className="inline-block h-4 w-4 rounded-[4px] border-[1.5px] border-border" />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/members/${emp.id}`} className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(emp.name)}`}>
                        {emp.name.slice(-2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-foreground group-hover:text-primary truncate">{emp.name}</p>
                        <p className="text-[11.5px] text-foreground-muted truncate">{emp.departmentName ?? "—"}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/members/${emp.id}`} className="block font-mono text-[12px] text-foreground-muted">
                      {emp.employeeNumber ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/members/${emp.id}`} className="block font-mono text-[12px] text-foreground-muted truncate max-w-[180px]">
                      {emp.companyEmail ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/members/${emp.id}`} className="block">
                      <p className="text-[13px] font-semibold text-foreground">{emp.departmentName ?? <span className="text-foreground-subtle font-normal">—</span>}</p>
                      {emp.positionName && (
                        <p className="text-[11.5px] text-foreground-muted">{emp.positionName}</p>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-foreground-muted">
                    <Link href={`/members/${emp.id}`} className="block">
                      {formatHireDate(emp.hireDate)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/members/${emp.id}`} className="block">
                      <span className="inline-flex items-center rounded-[5px] border border-border bg-background-secondary px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground-muted">
                        {EMP_TYPE_LABEL[emp.employmentType] ?? "—"}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/members/${emp.id}`} className="block">
                      <span className={`inline-flex items-center rounded-[5px] px-1.5 py-0.5 font-mono text-[11px] font-semibold ${STATUS_BADGE[emp.employmentStatus]}`}>
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

      {/* 하단 바 */}
      {view === "list" && filtered.length > 0 && (
        <div className="shrink-0 flex items-center justify-between border-t border-border bg-background-primary px-6 py-3">
          <span className="font-mono text-[11.5px] text-foreground-muted">
            {filtered.length}명 표시
            {filtered.length !== allEmployees.length && ` (전체 ${allEmployees.length}명)`}
          </span>
          <span className="font-mono text-[11.5px] text-foreground-subtle">
            1 – {filtered.length}
          </span>
        </div>
      )}
    </div>
  );
}
