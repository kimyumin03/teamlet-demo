import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listDepartments } from "@teamlet/modules/department";
import { listEmployees } from "@teamlet/modules/employee";
import { OrgTree } from "./_components/org-tree";

export const dynamic = "force-dynamic";

export default async function OrgChartPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const employeeId = session.user.employeeId;

  const [deptsResult, empsResult] = await Promise.all([
    listDepartments(employeeId),
    listEmployees(employeeId),
  ]);

  const departments = deptsResult.ok ? deptsResult.data : [];
  const employees = empsResult.ok
    ? empsResult.data.filter((e) => e.isActive && e.employmentStatus !== "RESIGNED")
    : [];

  const noAccess = !deptsResult.ok;

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="shrink-0 border-b border-border bg-background-primary px-6 py-5">
        <h1 className="text-[22px] font-bold leading-tight tracking-tight">조직도</h1>
      </div>

      {/* 탭 */}
      <div className="shrink-0 border-b border-border px-6">
        <nav className="flex gap-0">
          <Link
            href="/members"
            className="border-b-2 border-transparent -mb-px px-4 py-2.5 text-[13px] font-medium text-foreground-muted hover:text-foreground transition-colors"
          >
            구성원 목록
          </Link>
          <Link
            href="/members/org-chart"
            className="border-b-2 border-foreground -mb-px px-4 py-2.5 text-[13px] font-medium text-foreground transition-colors"
          >
            조직도
          </Link>
        </nav>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-auto px-6 py-6">
        {noAccess ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <p className="text-[14px] font-medium text-foreground">조직도를 볼 권한이 없어요</p>
            <p className="text-[12.5px] text-foreground-muted">
              <code className="rounded-[5px] bg-background-secondary px-1.5 py-0.5 font-mono text-[11px]">member.directory.read</code> 권한이 필요해요
            </p>
          </div>
        ) : departments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <p className="text-[14px] font-medium text-foreground">등록된 부서가 없어요</p>
            <p className="text-[12.5px] text-foreground-muted">구성원 목록에서 부서를 먼저 추가해 주세요</p>
          </div>
        ) : (
          <OrgTree departments={departments} employees={employees} />
        )}
      </div>
    </div>
  );
}
