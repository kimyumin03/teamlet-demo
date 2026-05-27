import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listApprovalPolicies } from "@teamlet/modules/workflow";
import { listEmployees } from "@teamlet/modules/employee";
import { ApprovalPoliciesClient } from "./_components/approval-policies-client";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  GENERAL: "일반",
  LEAVE_REQUEST: "휴가 신청",
  INFO_CHANGE: "정보 변경",
  ANNOUNCEMENT: "공지사항",
};

export default async function ApprovalPoliciesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const employeeId = session.user.employeeId;

  const [policiesResult, employeesResult] = await Promise.all([
    listApprovalPolicies(employeeId),
    listEmployees(employeeId),
  ]);

  const policies = policiesResult.ok ? policiesResult.data : [];
  const employees = employeesResult.ok
    ? employeesResult.data
        .filter((e) => e.isActive)
        .map((e) => ({ id: e.id, name: e.name, departmentName: e.departmentName }))
    : [];

  const noAccess = !policiesResult.ok;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">결재 정책</h1>
          <p className="mt-0.5 text-sm text-foreground-muted">
            문서 종류별 자동 결재선을 설정해요
          </p>
        </div>
      </div>

      {noAccess ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="text-sm font-medium text-foreground">결재 정책을 볼 권한이 없어요</p>
          <p className="text-xs text-foreground-muted">
            <code className="rounded bg-background-secondary px-1 py-0.5">workflow.template.manage</code> 권한이 필요해요
          </p>
        </div>
      ) : (
        <ApprovalPoliciesClient
          policies={policies}
          employees={employees}
          categoryLabel={CATEGORY_LABEL}
        />
      )}
    </div>
  );
}
