import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getEmployee, type EmployeeDetail } from "@teamlet/modules/employee";
import { ChevronLeft, Shield } from "lucide-react";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<EmployeeDetail["employmentStatus"], string> = {
  ACTIVE: "재직",
  PROBATION: "수습",
  ON_LEAVE: "휴직",
  SECONDED: "파견",
  RESIGNED: "퇴직",
  SCHEDULED: "입사 예정",
};

const ROLE_TYPE_LABEL: Partial<Record<EmployeeDetail["roles"][number]["roleType"], string>> = {
  SYSTEM_SUPER_ADMIN: "최고 관리자",
  DYNAMIC_ORG_HEAD: "조직장 (동적)",
  DEFAULT: "기본",
};

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-foreground-subtle">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const result = await getEmployee(session.user.employeeId, id);
  if (!result.ok) {
    if (result.error.code === "NOT_FOUND") notFound();
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p
          role="alert"
          className="rounded-md bg-destructive-50 px-4 py-3 text-sm text-destructive-700"
        >
          {result.error.message}
        </p>
      </div>
    );
  }

  const emp = result.data;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/members"
        className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        구성원 목록
      </Link>

      <header className="mt-4 mb-8 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{emp.name}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {emp.departmentName ?? "미배정"} ·{" "}
            {STATUS_LABEL[emp.employmentStatus]}
            {!emp.isActive && (
              <span className="ml-2 text-foreground-subtle">(비활성)</span>
            )}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-border bg-background-primary p-5">
          <h2 className="mb-4 text-sm font-medium text-foreground">기본 정보</h2>
          <dl className="grid grid-cols-2 gap-4">
            <Field label="사번">{emp.employeeNumber ?? "—"}</Field>
            <Field label="입사일">{formatDate(emp.hireDate)}</Field>
            <Field label="회사 이메일">{emp.companyEmail ?? "—"}</Field>
            <Field label="개인 이메일">{emp.personalEmail ?? "—"}</Field>
            <Field label="부서">{emp.departmentName ?? "미배정"}</Field>
            <Field label="등록일">{formatDate(emp.createdAt)}</Field>
          </dl>
        </section>

        <section className="rounded-lg border border-border bg-background-primary p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
            <Shield className="size-4 text-foreground-subtle" />
            권한 ({emp.roles.length})
          </h2>
          {emp.roles.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              배정된 역할이 없어요.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {emp.roles.map((r) => (
                <li
                  key={r.userRoleId}
                  className="flex items-center justify-between gap-2 rounded-md bg-background-secondary px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {r.roleName}
                    </span>
                    {r.isSystem && (
                      <span className="text-xs text-foreground-muted">
                        {ROLE_TYPE_LABEL[r.roleType] ?? "시스템"}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-foreground-subtle">
                    {formatDate(r.assignedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="mt-8 text-xs text-foreground-subtle">
        정보 수정 / 역할 배정 / 비활성화는 다음 단계에서 추가돼요.
      </p>
    </div>
  );
}
