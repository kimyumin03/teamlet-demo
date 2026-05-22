import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { listDepartments } from "@teamlet/modules/department";
import { getEmployee, type EmployeeDetail } from "@teamlet/modules/employee";
import { listAppointments, type AppointmentItem } from "@teamlet/modules/appointment";
import { listPositions } from "@teamlet/modules/position";
import { listEmployeeLeaveHistory } from "@teamlet/modules/leave";
import { listEmployeeDocuments } from "@teamlet/modules/workflow";
import { listRoles, type RoleListItem } from "@teamlet/modules/permission";
import type { LeaveRequestItem } from "@teamlet/modules/leave";
import type { DocumentListItem } from "@teamlet/modules/workflow";
import { auth } from "@/auth";
import { DeactivateEmployeeButton } from "@/components/members/deactivate-button";
import { EditMemberButton } from "@/components/members/edit-member-button";
import { InviteLinkButton } from "@/components/members/invite-link-button";
import { MemberRolesManager } from "@/components/members/member-roles-manager";
import { RegisterAppointmentButton } from "@/components/members/register-appointment-button";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<EmployeeDetail["employmentStatus"], string> = {
  ACTIVE: "재직", PROBATION: "수습", ON_LEAVE: "휴직",
  SECONDED: "파견", RESIGNED: "퇴직", SCHEDULED: "입사예정",
};
const STATUS_BG: Record<EmployeeDetail["employmentStatus"], string> = {
  ACTIVE: "bg-green-50 text-green-700 ring-green-200",
  PROBATION: "bg-amber-50 text-amber-700 ring-amber-200",
  ON_LEAVE: "bg-slate-100 text-slate-600 ring-slate-200",
  SECONDED: "bg-blue-50 text-blue-700 ring-blue-200",
  RESIGNED: "bg-slate-100 text-slate-500 ring-slate-200",
  SCHEDULED: "bg-blue-50 text-blue-700 ring-blue-200",
};
const EMP_TYPE_LABEL: Record<EmployeeDetail["employmentType"], string> = {
  FULL_TIME: "정규직", PART_TIME: "파트타임", CONTRACT: "계약직",
  INTERN: "인턴", DISPATCH: "파견",
};
const GENDER_LABEL: Record<string, string> = { MALE: "남성", FEMALE: "여성", OTHER: "기타" };

const LEAVE_STATUS_LABEL: Record<string, string> = {
  DRAFT: "임시저장", PENDING: "검토중", APPROVED: "승인", REJECTED: "반려", CANCELLED: "취소",
};
const LEAVE_STATUS_CLASS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-500",
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-400",
};
const DOC_STATUS_LABEL: Record<string, string> = {
  DRAFT: "임시저장", IN_PROGRESS: "진행중", APPROVED: "승인", REJECTED: "반려", CANCELLED: "취소",
};
const DOC_STATUS_CLASS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-500",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  APPROVED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-400",
};
const APPT_KIND_LABEL: Record<string, string> = {
  HIRE: "입사", TRANSFER: "부서 이동", PROMOTION: "직책 변경", LEAVE: "휴직", RETURN: "복직",
  SECONDMENT: "파견", RESIGNATION: "퇴직",
};

const TABS = [
  { key: "info", label: "기본 정보" },
  { key: "appointment", label: "발령 이력" },
  { key: "leave", label: "휴가" },
  { key: "workflow", label: "결재 문서" },
  { key: "roles", label: "권한" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function fmt(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-foreground-subtle">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}

const AVATAR_COLORS = [
  "from-blue-400 to-blue-600",
  "from-violet-400 to-violet-600",
  "from-emerald-400 to-emerald-600",
  "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600",
  "from-cyan-400 to-cyan-600",
];
function avatarGradient(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]!;
}

export default async function MemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const activeTab: TabKey = (TABS.find((t) => t.key === tabParam)?.key ?? "info") as TabKey;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const [empResult, deptResult, posResult, leaveResult, workflowResult, rolesResult, apptResult] =
    await Promise.all([
      getEmployee(session.user.employeeId, id),
      listDepartments(session.user.employeeId),
      listPositions(session.user.employeeId),
      listEmployeeLeaveHistory(session.user.employeeId, id),
      listEmployeeDocuments(session.user.employeeId, id),
      listRoles(session.user.employeeId),
      listAppointments(session.user.employeeId, id),
    ]);

  if (!empResult.ok) {
    if (empResult.error.code === "NOT_FOUND") notFound();
    return (
      <div className="p-8">
        <p className="rounded-lg bg-destructive-50 px-4 py-3 text-sm text-destructive-700">
          {empResult.error.message}
        </p>
      </div>
    );
  }

  const emp = empResult.data;
  const departments = deptResult.ok ? deptResult.data : [];
  const positions = posResult.ok ? posResult.data : [];
  const leaveHistory: LeaveRequestItem[] = leaveResult.ok ? leaveResult.data : [];
  const workflowDocs: DocumentListItem[] = workflowResult.ok ? workflowResult.data : [];
  const assignableRoles: RoleListItem[] = rolesResult.ok ? rolesResult.data : [];
  const appointments: AppointmentItem[] = apptResult.ok ? apptResult.data : [];

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 카드 */}
      <div className="border-b border-border bg-background-primary px-6 py-5">
        <Link href="/members" className="mb-4 inline-flex items-center gap-1 text-xs text-foreground-subtle hover:text-foreground">
          <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5"><path fillRule="evenodd" d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 1.06L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z" clipRule="evenodd"/></svg>
          구성원 목록
        </Link>

        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* 아바타 */}
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xl font-bold text-white ${avatarGradient(emp.name)}`}>
              {emp.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-semibold text-foreground">{emp.name}</h1>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_BG[emp.employmentStatus]}`}>
                  {STATUS_LABEL[emp.employmentStatus]}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-foreground-muted">
                {[emp.departmentName, emp.positionName, EMP_TYPE_LABEL[emp.employmentType]].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-1 text-xs text-foreground-subtle">
                {emp.companyEmail ?? "이메일 미등록"}
                {emp.hireDate && <> · 입사 {fmt(emp.hireDate)}</>}
                {emp.employeeNumber && <> · {emp.employeeNumber}</>}
              </p>
            </div>
          </div>

          {emp.isActive && (
            <div className="flex shrink-0 items-center gap-2">
              {!emp.hasLinkedAccount && <InviteLinkButton employeeId={emp.id} />}
              <EditMemberButton employee={emp} />
              <DeactivateEmployeeButton employeeId={emp.id} employeeName={emp.name} redirectAfter="/members" />
            </div>
          )}
        </div>

        {/* 탭 바 */}
        <div className="mt-5 flex gap-0 border-b border-transparent -mb-px">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/members/${id}?tab=${t.key}`}
              className={`border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-auto p-6">

        {/* ── 기본 정보 탭 ── */}
        {activeTab === "info" && (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* 기본 정보 */}
            <div className="rounded-xl border border-border bg-background-primary p-5">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground-subtle">기본 정보</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="사번" value={emp.employeeNumber} />
                <Field label="입사일" value={fmt(emp.hireDate)} />
                <Field label="성별" value={emp.gender ? GENDER_LABEL[emp.gender] : null} />
                <Field label="생년월일" value={fmt(emp.birthDate)} />
                <Field label="연락처" value={emp.phone} />
                <Field label="등록일" value={fmt(emp.createdAt)} />
                <Field label="회사 이메일" value={emp.companyEmail} />
                <Field label="개인 이메일" value={emp.personalEmail} />
              </dl>
            </div>

            {/* 인사 정보 */}
            <div className="rounded-xl border border-border bg-background-primary p-5">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground-subtle">인사 정보</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="부서" value={emp.departmentName ?? "미배정"} />
                <Field label="직책" value={emp.positionName ?? "미지정"} />
                <Field label="고용형태" value={EMP_TYPE_LABEL[emp.employmentType]} />
                <Field label="재직상태" value={STATUS_LABEL[emp.employmentStatus]} />
                {emp.probationEndDate && <Field label="수습 종료일" value={fmt(emp.probationEndDate)} />}
                {emp.resignedAt && <Field label="퇴직일" value={fmt(emp.resignedAt)} />}
              </dl>
              <div className="mt-4 border-t border-border pt-4">
                <dt className="text-xs text-foreground-subtle">계정 연결</dt>
                <dd className="mt-0.5 text-sm">
                  {emp.hasLinkedAccount
                    ? <span className="text-green-700">연결됨</span>
                    : <span className="text-foreground-muted">미연결 (초대 링크로 연결 가능)</span>
                  }
                </dd>
              </div>
            </div>

            {/* 휴가 잔여 */}
            {emp.leaveBalances.length > 0 && (
              <div className="rounded-xl border border-border bg-background-primary p-5 lg:col-span-2">
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground-subtle">휴가 잔여</h2>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {emp.leaveBalances.map((lb) => {
                    const total = Number(lb.granted) + Number(lb.adjusted);
                    const used = Number(lb.used);
                    const remaining = Number(lb.remaining);
                    const pct = total > 0 ? Math.round((used / total) * 100) : 0;
                    return (
                      <div key={lb.leaveTypeName} className="rounded-lg border border-border p-4">
                        <p className="text-xs text-foreground-muted">{lb.leaveTypeName}</p>
                        <p className="mt-1.5 text-2xl font-bold text-foreground">
                          {remaining}
                          <span className="ml-1 text-sm font-normal text-foreground-subtle">/ {total}일</span>
                        </p>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-background-secondary">
                          <div
                            className="h-1.5 rounded-full bg-primary/60"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-foreground-subtle">사용 {used}일</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 발령 이력 탭 ── */}
        {activeTab === "appointment" && (
          <div className="rounded-xl border border-border bg-background-primary">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">인사 발령 이력</h2>
                <p className="mt-0.5 text-xs text-foreground-subtle">
                  현재 · {emp.departmentName ?? "미배정"} {emp.positionName ? `/ ${emp.positionName}` : ""}
                </p>
              </div>
              {emp.isActive && (
                <RegisterAppointmentButton
                  employeeId={emp.id}
                  currentDepartmentId={emp.departmentId}
                  currentPositionId={emp.positionId}
                  departments={departments}
                  positions={positions}
                />
              )}
            </div>
            {appointments.length === 0 ? (
              <p className="px-5 py-8 text-sm text-foreground-muted">발령 이력이 없어요.</p>
            ) : (
              <ul className="divide-y divide-border">
                {appointments.map((a) => (
                  <li key={a.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="rounded-md bg-background-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                          {APPT_KIND_LABEL[a.kind] ?? a.kind}
                        </span>
                        <div className="text-sm">
                          {a.toDepartmentName && (
                            <span className="text-foreground">{a.toDepartmentName}</span>
                          )}
                          {a.toPositionName && (
                            <span className="text-foreground-muted"> / {a.toPositionName}</span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-foreground-subtle">{fmt(a.effectiveDate)}</span>
                    </div>
                    {(a.fromDepartmentName !== a.toDepartmentName || a.fromPositionName !== a.toPositionName) && (
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-foreground-subtle">
                        {a.fromDepartmentName !== a.toDepartmentName && (
                          <span>부서 {a.fromDepartmentName ?? "미배정"} → {a.toDepartmentName ?? "미배정"}</span>
                        )}
                        {a.fromPositionName !== a.toPositionName && (
                          <span>직책 {a.fromPositionName ?? "미지정"} → {a.toPositionName ?? "미지정"}</span>
                        )}
                      </div>
                    )}
                    {a.memo && <p className="mt-1.5 text-xs text-foreground-subtle">{a.memo}</p>}
                    <p className="mt-1.5 text-xs text-foreground-subtle">
                      {a.appointedByName} · {fmt(a.createdAt)} 등록
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── 휴가 탭 ── */}
        {activeTab === "leave" && (
          <div className="flex flex-col gap-4">
            {emp.leaveBalances.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {emp.leaveBalances.map((lb) => {
                  const total = Number(lb.granted) + Number(lb.adjusted);
                  const remaining = Number(lb.remaining);
                  return (
                    <div key={lb.leaveTypeName} className="rounded-xl border border-border bg-background-primary p-4">
                      <p className="text-xs text-foreground-muted">{lb.leaveTypeName}</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        {remaining}
                        <span className="ml-1 text-sm font-normal text-foreground-subtle">/ {total}일</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="rounded-xl border border-border bg-background-primary">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">
                  휴가 신청 이력 <span className="ml-1 text-foreground-subtle">({leaveHistory.length})</span>
                </h2>
              </div>
              {leaveHistory.length === 0 ? (
                <p className="px-5 py-8 text-sm text-foreground-muted">신청 이력이 없어요.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-foreground-subtle">
                      <th className="px-5 py-2.5 font-medium">유형</th>
                      <th className="px-4 py-2.5 font-medium">기간</th>
                      <th className="px-4 py-2.5 font-medium">사유</th>
                      <th className="px-4 py-2.5 font-medium">신청일</th>
                      <th className="px-4 py-2.5 font-medium">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leaveHistory.map((r) => (
                      <tr key={r.id} className="hover:bg-background-secondary">
                        <td className="px-5 py-3 font-medium text-foreground">{r.leaveTypeName}</td>
                        <td className="px-4 py-3 text-foreground-muted">
                          {fmt(r.startDate)} ~ {fmt(r.endDate)}
                          <span className="ml-1 text-foreground-subtle">({r.days}일)</span>
                        </td>
                        <td className="px-4 py-3 text-foreground-muted">{r.reason || "—"}</td>
                        <td className="px-4 py-3 text-foreground-subtle">{fmt(r.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEAVE_STATUS_CLASS[r.status] ?? ""}`}>
                            {LEAVE_STATUS_LABEL[r.status] ?? r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── 결재 문서 탭 ── */}
        {activeTab === "workflow" && (
          <div className="rounded-xl border border-border bg-background-primary">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">
                기안 문서 <span className="ml-1 text-foreground-subtle">({workflowDocs.length})</span>
              </h2>
            </div>
            {workflowDocs.length === 0 ? (
              <p className="px-5 py-8 text-sm text-foreground-muted">기안한 문서가 없어요.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-foreground-subtle">
                    <th className="px-5 py-2.5 font-medium">제목</th>
                    <th className="px-4 py-2.5 font-medium">결재 단계</th>
                    <th className="px-4 py-2.5 font-medium">신청일</th>
                    <th className="px-4 py-2.5 font-medium">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {workflowDocs.map((d) => (
                    <tr key={d.id} className="hover:bg-background-secondary">
                      <td className="px-5 py-3">
                        <Link href={`/workflow/documents/${d.id}`} className="font-medium text-foreground hover:text-primary">
                          {d.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-foreground-muted">
                        {d.currentStep != null ? `${d.currentStep} / ${d.totalSteps}단계` : `${d.totalSteps}단계`}
                      </td>
                      <td className="px-4 py-3 text-foreground-subtle">{fmt(d.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DOC_STATUS_CLASS[d.status] ?? ""}`}>
                          {DOC_STATUS_LABEL[d.status] ?? d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── 권한 탭 ── */}
        {activeTab === "roles" && (
          <MemberRolesManager
            employeeId={emp.id}
            employeeName={emp.name}
            assignedRoles={emp.roles}
            assignableRoles={assignableRoles}
          />
        )}
      </div>
    </div>
  );
}
