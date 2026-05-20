import { redirect } from "next/navigation";
import { listEmployees, type EmployeeListItem } from "@teamlet/modules/employee";
import { EmptyState } from "@teamlet/ui";
import { UsersRound } from "lucide-react";
import { auth } from "@/auth";
import { AddMemberButton } from "@/components/members/add-member-button";

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

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const result = await listEmployees(session.user.employeeId);

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-foreground">구성원</h1>
        <p
          role="alert"
          className="mt-6 rounded-md bg-destructive-50 px-4 py-3 text-sm text-destructive-700"
        >
          {result.error.message}
        </p>
      </div>
    );
  }

  const employees = result.data;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-6 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">구성원</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            전체 {employees.length}명
          </p>
        </div>
        <AddMemberButton />
      </header>

      {employees.length === 0 ? (
        <EmptyState
          icon={<UsersRound />}
          title="아직 등록된 구성원이 없어요"
          description="회사 신청 승인 시 신청자 본인이 첫 구성원으로 등록돼요."
        />
      ) : (
        <ul className="flex flex-col gap-1">
          {employees.map((emp) => (
            <li
              key={emp.id}
              className="grid grid-cols-[1.5fr_1fr_1fr_auto] items-center gap-4 rounded-lg border border-border bg-background-primary px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">{emp.name}</span>
                {emp.companyEmail && (
                  <span className="text-sm text-foreground-muted">
                    {emp.companyEmail}
                  </span>
                )}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
