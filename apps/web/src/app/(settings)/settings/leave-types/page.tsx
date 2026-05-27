import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listLeaveTypesFull } from "@teamlet/modules/leave";
import { LeaveTypesClient } from "./_components/leave-types-client";

export const dynamic = "force-dynamic";

export default async function LeaveTypesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const employeeId = session.user.employeeId;
  const result = await listLeaveTypesFull(employeeId);

  const noAccess = !result.ok;
  const types = result.ok ? result.data : [];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">휴가 종류</h1>
          <p className="mt-0.5 text-sm text-foreground-muted">
            회사에서 사용하는 휴가 종류를 관리해요
          </p>
        </div>
      </div>

      {noAccess ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="text-sm font-medium text-foreground">휴가 종류를 볼 권한이 없어요</p>
          <p className="text-xs text-foreground-muted">
            <code className="rounded bg-background-secondary px-1 py-0.5">leave.policy.manage</code>{" "}
            권한이 필요해요
          </p>
        </div>
      ) : (
        <LeaveTypesClient types={types} />
      )}
    </div>
  );
}
