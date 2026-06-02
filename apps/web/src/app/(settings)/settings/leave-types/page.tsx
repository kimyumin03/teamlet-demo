import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listLeaveTypesFull } from "@teamlet/modules/leave";
import { listEmployees } from "@teamlet/modules/employee";
import { listDepartments } from "@teamlet/modules/department";
import { LeaveTypesClient } from "./_components/leave-types-client";

export const dynamic = "force-dynamic";

export default async function LeaveTypesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const employeeId = session.user.employeeId;
  const [result, employeesResult, departmentsResult] = await Promise.all([
    listLeaveTypesFull(employeeId),
    listEmployees(employeeId),
    listDepartments(employeeId),
  ]);

  const noAccess = !result.ok;
  // 연차는 연차 설정(leave-policies)에서 별도 관리 — 맞춤 휴가 목록에서 제외
  const types = result.ok ? result.data.filter((t) => t.key !== "annual") : [];
  const employees = employeesResult.ok
    ? employeesResult.data
        .filter((e) => e.isActive)
        .map((e) => ({ id: e.id, name: e.name, departmentId: e.departmentId, departmentName: e.departmentName }))
    : [];
  const departments = departmentsResult.ok
    ? departmentsResult.data.map((d) => ({ id: d.id, name: d.name, parentId: d.parentId }))
    : [];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="h-title">맞춤 휴가</h1>
          <p className="h-sub">법정·회사 자율 휴가 종류를 관리해요</p>
        </div>
      </div>

      {noAccess ? (
        <div className="rounded-[14px] border border-border bg-background-primary px-[26px] py-16 text-center">
          <p className="text-[14px] font-medium text-foreground">휴가 종류를 볼 권한이 없어요</p>
          <p className="mt-1 text-[12.5px] text-foreground-muted">
            <code className="rounded bg-background-secondary px-1 py-0.5 text-[11.5px]">leave.policy.manage</code>{" "}
            권한이 필요해요
          </p>
        </div>
      ) : (
        <div className="rounded-[14px] border border-border bg-background-primary px-[26px] py-[22px]">
          <LeaveTypesClient types={types} employees={employees} departments={departments} />
        </div>
      )}
    </div>
  );
}
