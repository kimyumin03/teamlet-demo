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
          <h1 className="h-title">휴가 종류</h1>
          <p className="h-sub">
            회사에서 사용하는 휴가 종류를 관리해요
          </p>
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
          <h3 className="mb-1.5 text-[15px] font-bold text-foreground">휴가 종류 목록</h3>
          <p className="mb-5 text-[12.5px] text-foreground-muted">법정·회사 자율 휴가 종류를 정의해요. 법정 종류는 삭제할 수 없어요.</p>
          <LeaveTypesClient types={types} />
        </div>
      )}
    </div>
  );
}
