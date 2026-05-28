import Link from "next/link";
import { redirect } from "next/navigation";
import { listPendingLeaveRequests, listLeaveTypes } from "@teamlet/modules/leave";
import { listEmployees } from "@teamlet/modules/employee";
import { auth } from "@/auth";
import { ApproveRejectButtons } from "@/components/leave/approve-reject-buttons";
import { GrantLeaveButton } from "@/components/leave/grant-leave-button";

export const dynamic = "force-dynamic";

function formatDate(d: Date): string {
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default async function LeaveRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const employeeId = session.user.employeeId;
  const [result, employeesResult, typesResult] = await Promise.all([
    listPendingLeaveRequests(employeeId),
    listEmployees(employeeId),
    listLeaveTypes(employeeId),
  ]);
  const requests = result.ok ? result.data : [];
  const employees = employeesResult.ok
    ? employeesResult.data.filter((e) => e.employmentStatus === "ACTIVE" || e.employmentStatus === "PROBATION")
    : [];
  const leaveTypes = typesResult.ok ? typesResult.data : [];

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="shrink-0 border-b border-border bg-background-primary px-6 py-5">
        <Link
          href="/leave"
          className="mb-3 inline-flex items-center gap-1 text-[12px] text-foreground-subtle hover:text-foreground transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
            <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 1.06L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z" clipRule="evenodd" />
          </svg>
          내 휴가
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight">휴가 승인</h1>
            <p className="mt-0.5 text-[13px] text-foreground-muted">대기 중인 신청 {requests.length}건</p>
          </div>
          <GrantLeaveButton employees={employees} leaveTypes={leaveTypes} />
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="mx-auto max-w-2xl flex flex-col gap-3">
          {!result.ok && (
            <p role="alert" className="rounded-[14px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">
              {result.error.message}
            </p>
          )}

          {result.ok && requests.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <p className="text-[14px] font-medium text-foreground">대기 중인 신청이 없어요</p>
              <p className="text-[12.5px] text-foreground-muted">모든 휴가 신청이 처리됐어요.</p>
            </div>
          ) : (
            requests.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-4 rounded-[14px] border border-border bg-background-primary px-5 py-4"
              >
                <div className="min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-foreground">{r.employeeName}</span>
                    <span className="rounded-[5px] border border-border bg-background-secondary px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground-muted">
                      {r.leaveTypeName}
                    </span>
                  </div>
                  <span className="text-[12px] text-foreground-muted">
                    {formatDate(r.startDate)} ~ {formatDate(r.endDate)} · {r.days}일
                    {r.reason && <span className="ml-2 text-foreground-subtle">· {r.reason}</span>}
                  </span>
                </div>
                <div className="shrink-0">
                  <ApproveRejectButtons requestId={r.id} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
