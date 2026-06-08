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
import { DepartmentSidebar } from "@/components/members/department-sidebar";
import { OrgTree } from "./org-chart/_components/org-tree";
import { MembersFilterBar } from "./_components/members-filter-bar";

export const dynamic = "force-dynamic";

const UNASSIGNED = "__none__";

const STATUS_LABEL: Record<EmployeeListItem["employmentStatus"], string> = {
  ACTIVE: "재직", PROBATION: "수습", ON_LEAVE: "휴직",
  SECONDED: "파견", RESIGNED: "퇴직", SCHEDULED: "입사예정",
};
const STATUS_CLS: Record<EmployeeListItem["employmentStatus"], string> = {
  ACTIVE: "ok", PROBATION: "wait", ON_LEAVE: "end",
  SECONDED: "run", RESIGNED: "end", SCHEDULED: "wait",
};
const EMP_TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "정규", PART_TIME: "파트", CONTRACT: "계약",
  INTERN: "인턴", DISPATCH: "파견",
};

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

  // 헤더 요약 통계
  const employedCount = allEmployees.filter(
    (e) => e.employmentStatus === "ACTIVE" || e.employmentStatus === "PROBATION" || e.employmentStatus === "SECONDED",
  ).length;
  const onLeaveCount = allEmployees.filter((e) => e.employmentStatus === "ON_LEAVE").length;
  const scheduledCount = allEmployees.filter((e) => e.employmentStatus === "SCHEDULED").length;

  const filtered = allEmployees.filter((e) => {
    if (selected === UNASSIGNED && e.departmentId) return false;
    if (selected && selected !== UNASSIGNED && e.departmentId !== selected) return false;
    if (statusFilter && e.employmentStatus !== statusFilter) return false;
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

  const unassignedCount = allEmployees.filter((e) => !e.departmentId).length;

  return (
    <div className="mbr-wrap">
      {/* 좌측 조직 트리 (디자인·Flex 패턴) */}
      <DepartmentSidebar
        departments={departments}
        selected={selected}
        totalCount={allEmployees.length}
        unassignedCount={unassignedCount}
      />

      <div className="mbr-main">
        {/* 고정: 대기 중인 가입 신청 */}
        {pendingMembers.length > 0 && (
          <div className="shrink-0">
            <PendingJoinPanel items={pendingMembers} />
          </div>
        )}

        {/* 고정: 헤더 */}
        <div className="shrink-0 px-8 pt-7 pb-3">
          <div className="page-h" style={{ marginBottom: 0 }}>
            <div>
              <h1 className="h-title">구성원</h1>
              <div className="h-sub">
                전체 {allEmployees.length}명
                {employedCount > 0 && ` · 재직 ${employedCount}`}
                {onLeaveCount > 0 && ` · 휴직 ${onLeaveCount}`}
                {scheduledCount > 0 && ` · 입사예정 ${scheduledCount}`}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div className="vtog">
                <Link href={listHref} className={`v${view === "list" ? " active" : ""}`}>
                  <svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
                  리스트
                </Link>
                <Link href={orgHref} className={`v${view === "org" ? " active" : ""}`}>
                  <svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-2h12v2"/></svg>
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

        {/* 고정: 필터 바 */}
        <div className="shrink-0 px-8 pb-3">
          <Suspense>
            <MembersFilterBar initialQ={query} />
          </Suspense>
        </div>

        {/* 스크롤: 구성원 목록 */}
        <div className="flex-1 overflow-auto px-8 pb-10">
          {view === "org" ? (
            <>
              {departments.length === 0 ? (
                <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--fg-muted)" }}>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--fg)", marginBottom: "6px" }}>등록된 부서가 없어요</div>
                  <div style={{ fontSize: "12.5px" }}>부서를 먼저 추가해 주세요.</div>
                </div>
              ) : (
                <OrgTree departments={departments} employees={orgEmployees} />
              )}
            </>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--fg-muted)" }}>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--fg)", marginBottom: "6px" }}>
                {query ? "검색 결과가 없어요" : "구성원이 없어요"}
              </div>
              <div style={{ fontSize: "12.5px" }}>
                {query ? "다른 키워드로 검색해 보세요." : "우측 상단 '구성원 추가'로 등록할 수 있어요."}
              </div>
            </div>
          ) : (
            <>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: "32px" }}><span className="cb-box" /></th>
                    <th style={{ width: "22%" }}>이름</th>
                    <th>사번</th>
                    <th>이메일</th>
                    <th>조직 · 직책</th>
                    <th>입사일</th>
                    <th>근로유형</th>
                    <th>상태</th>
                    <th>권한</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp) => (
                    <tr key={emp.id} style={emp.employmentStatus === "RESIGNED" ? { opacity: 0.5 } : undefined}>
                      <td><span className="cb-box" /></td>
                      <td>
                        <Link href={`/members/${emp.id}`} className="ppl" style={{ textDecoration: "none" }}>
                          <div className="av">{emp.name.slice(-2)}</div>
                          <div>
                            <div className="n">{emp.name}</div>
                            <div className="m" style={{ fontSize: "11.5px" }}>{emp.companyEmail ?? emp.departmentName ?? "—"}</div>
                          </div>
                        </Link>
                      </td>
                      <td><span className="sn">{emp.employeeNumber ?? "—"}</span></td>
                      <td>
                        <span style={{ fontSize: "12.5px", color: "var(--fg-muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                          {emp.companyEmail ?? "—"}
                        </span>
                      </td>
                      <td>
                        <div className="role-cell">
                          <div className="r">{emp.departmentName ?? "—"}</div>
                          {emp.positionName && <div className="o">{emp.positionName}</div>}
                        </div>
                      </td>
                      <td><span className="sn">{formatHireDate(emp.hireDate)}</span></td>
                      <td><span className="tag">{EMP_TYPE_LABEL[emp.employmentType] ?? "—"}</span></td>
                      <td><span className={`st ${STATUS_CLS[emp.employmentStatus]}`}>{STATUS_LABEL[emp.employmentStatus]}</span></td>
                      <td>
                        {emp.roleName ? (
                          <span className="tag adm">{emp.roleName}</span>
                        ) : (
                          <span className="tag" style={{ color: "var(--fg-subtle)" }}>일반</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
                <span>{filtered.length}명 표시{filtered.length !== allEmployees.length && ` (전체 ${allEmployees.length}명)`}</span>
                <span>1 – {filtered.length}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
