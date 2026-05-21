import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { listDepartments } from "@teamlet/modules/department";
import { getEmployee, type EmployeeDetail } from "@teamlet/modules/employee";
import { listPositions } from "@teamlet/modules/position";
import { ChevronLeft, Shield } from "lucide-react";
import { auth } from "@/auth";
import { DeactivateEmployeeButton } from "@/components/members/deactivate-button";
import { EditMemberButton } from "@/components/members/edit-member-button";
import { InviteLinkButton } from "@/components/members/invite-link-button";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<EmployeeDetail["employmentStatus"], string> = {
  ACTIVE: "재직",
  PROBATION: "수습",
  ON_LEAVE: "휴직",
  SECONDED: "파견",
  RESIGNED: "퇴직",
  SCHEDULED: "입사 예정",
};

const EMP_TYPE_LABEL: Record<EmployeeDetail["employmentType"], string> = {
  FULL_TIME: "정규직",
  PART_TIME: "파트타임",
  CONTRACT: "계약직",
  INTERN: "인턴",
  DISPATCH: "파견",
};

const GENDER_LABEL: Record<string, string> = {
  MALE: "남성",
  FEMALE: "여성",
  OTHER: "기타",
};

const TABS = [
  { key: "info", label: "정보" },
  { key: "documents", label: "문서·증명서" },
  { key: "roles", label: "권한" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-foreground-subtle">{label}</dt>
      <dd className="text-sm text-foreground">{children || "—"}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-background-primary p-5">
      <h2 className="mb-4 text-sm font-medium text-foreground">{title}</h2>
      <dl className="grid grid-cols-2 gap-4">{children}</dl>
    </section>
  );
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

  const [empResult, deptResult, posResult] = await Promise.all([
    getEmployee(session.user.employeeId, id),
    listDepartments(session.user.employeeId),
    listPositions(session.user.employeeId),
  ]);

  if (!empResult.ok) {
    if (empResult.error.code === "NOT_FOUND") notFound();
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p role="alert" className="rounded-md bg-destructive-50 px-4 py-3 text-sm text-destructive-700">
          {empResult.error.message}
        </p>
      </div>
    );
  }

  const emp = empResult.data;
  const departments = deptResult.ok ? deptResult.data : [];
  const positions = posResult.ok ? posResult.data : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* 뒤로가기 */}
      <Link href="/members" className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground">
        <ChevronLeft className="size-4" />
        구성원 목록
      </Link>

      {/* 헤더 */}
      <header className="mt-4 mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{emp.name}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {emp.departmentName ?? "미배정"}
            {emp.positionName && <span> · {emp.positionName}</span>}
            {" · "}
            <span className={emp.isActive ? "text-foreground-muted" : "text-destructive-600"}>
              {STATUS_LABEL[emp.employmentStatus]}
            </span>
          </p>
        </div>
        {emp.isActive && (
          <div className="flex flex-wrap items-center gap-2">
            {!emp.hasLinkedAccount && <InviteLinkButton employeeId={emp.id} />}
            <EditMemberButton employee={emp} departments={departments} positions={positions} />
            <DeactivateEmployeeButton employeeId={emp.id} employeeName={emp.name} redirectAfter="/members" />
          </div>
        )}
      </header>

      {/* 탭 */}
      <div className="mb-6 flex gap-0 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/members/${id}?tab=${t.key}`}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "border-b-2 border-foreground text-foreground"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* 정보 탭 */}
      {activeTab === "info" && (
        <div className="flex flex-col gap-4">
          <Section title="기본 정보">
            <Field label="사번">{emp.employeeNumber}</Field>
            <Field label="입사일">{formatDate(emp.hireDate)}</Field>
            <Field label="성별">{emp.gender ? GENDER_LABEL[emp.gender] : null}</Field>
            <Field label="생년월일">{formatDate(emp.birthDate)}</Field>
            <Field label="회사 이메일">{emp.companyEmail}</Field>
            <Field label="개인 이메일">{emp.personalEmail}</Field>
            <Field label="연락처">{emp.phone}</Field>
            <Field label="등록일">{formatDate(emp.createdAt)}</Field>
          </Section>

          <Section title="인사 정보">
            <Field label="부서">{emp.departmentName ?? "미배정"}</Field>
            <Field label="직책">{emp.positionName ?? "미지정"}</Field>
            <Field label="고용형태">{EMP_TYPE_LABEL[emp.employmentType]}</Field>
            <Field label="재직상태">{STATUS_LABEL[emp.employmentStatus]}</Field>
            {emp.probationEndDate && (
              <Field label="수습 종료일">{formatDate(emp.probationEndDate)}</Field>
            )}
            {emp.resignedAt && (
              <Field label="퇴직일">{formatDate(emp.resignedAt)}</Field>
            )}
          </Section>

          {emp.leaveBalances.length > 0 && (
            <section className="rounded-lg border border-border bg-background-primary p-5">
              <h2 className="mb-4 text-sm font-medium text-foreground">휴가 잔여</h2>
              <div className="flex flex-wrap gap-3">
                {emp.leaveBalances.map((lb) => (
                  <div key={lb.leaveTypeName} className="flex flex-col items-center rounded-md border border-border px-4 py-3 text-center">
                    <span className="text-xs text-foreground-muted">{lb.leaveTypeName}</span>
                    <span className="mt-1 text-xl font-semibold text-foreground">{lb.remaining}</span>
                    <span className="text-xs text-foreground-subtle">일</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* 문서·증명서 탭 */}
      {activeTab === "documents" && (
        <div className="rounded-lg border border-border bg-background-primary p-6 text-center text-sm text-foreground-muted">
          <p>이 직원의 발급 증명서를 조회하려면</p>
          <Link href="/documents/certificates" className="mt-2 inline-block text-foreground underline hover:no-underline">
            증명서 발급 페이지
          </Link>
          <p className="mt-1">에서 확인하세요.</p>
        </div>
      )}

      {/* 권한 탭 */}
      {activeTab === "roles" && (
        <section className="rounded-lg border border-border bg-background-primary p-5">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="size-4 text-foreground-subtle" />
            <h2 className="text-sm font-medium text-foreground">배정된 역할 ({emp.roles.length})</h2>
          </div>
          {emp.roles.length === 0 ? (
            <p className="text-sm text-foreground-muted">배정된 역할이 없어요.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {emp.roles.map((r) => (
                <li key={r.userRoleId} className="flex items-center justify-between rounded-md bg-background-secondary px-3 py-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{r.roleName}</span>
                    {r.isSystem && (
                      <span className="text-xs text-foreground-muted">
                        {r.roleType === "SYSTEM_SUPER_ADMIN" ? "최고 관리자" : r.roleType === "DYNAMIC_ORG_HEAD" ? "조직장 (동적)" : "시스템"}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-foreground-subtle">{formatDate(r.assignedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
