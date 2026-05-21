import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Inbox } from "lucide-react";
import { listPendingLeaveRequests } from "@teamlet/modules/leave";
import { EmptyState, Button } from "@teamlet/ui";
import { auth } from "@/auth";
import { ApproveRejectButtons } from "@/components/leave/approve-reject-buttons";

export const dynamic = "force-dynamic";

function formatDate(d: Date): string {
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default async function LeaveRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const result = await listPendingLeaveRequests(session.user.employeeId);
  const requests = result.ok ? result.data : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-8 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/leave"><ChevronLeft /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">휴가 승인</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            대기 중인 신청 {requests.length}건
          </p>
        </div>
      </header>

      {!result.ok && (
        <p role="alert" className="rounded-md bg-destructive-50 px-4 py-3 text-sm text-destructive-700">
          {result.error.message}
        </p>
      )}

      {result.ok && requests.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title="대기 중인 신청이 없어요"
          description="모든 휴가 신청이 처리됐어요."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {requests.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background-primary px-4 py-4"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{r.employeeName}</span>
                  <span className="rounded bg-background-secondary px-1.5 py-0.5 text-xs text-foreground-muted">
                    {r.leaveTypeName}
                  </span>
                </div>
                <span className="text-sm text-foreground-muted">
                  {formatDate(r.startDate)} ~ {formatDate(r.endDate)} · {r.days}일
                  {r.reason && <span className="ml-2 text-foreground-subtle">· {r.reason}</span>}
                </span>
              </div>
              <ApproveRejectButtons requestId={r.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
