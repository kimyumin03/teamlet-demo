import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarOff } from "lucide-react";
import { getLeaveBalances, listLeaveTypes, listMyLeaveRequests } from "@teamlet/modules/leave";
import type { LeaveRequestItem } from "@teamlet/modules/leave";
import { EmptyState, Button } from "@teamlet/ui";
import { auth } from "@/auth";
import { LeaveRequestButton } from "@/components/leave/leave-request-button";
import { CancelLeaveButton } from "@/components/leave/cancel-leave-button";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<LeaveRequestItem["status"], string> = {
  DRAFT: "임시저장",
  PENDING: "대기",
  APPROVED: "승인",
  REJECTED: "반려",
  CANCELLED: "취소",
};

const STATUS_CLASS: Record<LeaveRequestItem["status"], string> = {
  DRAFT: "bg-background-secondary text-foreground-subtle",
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-background-secondary text-foreground-muted",
  REJECTED: "bg-destructive-50 text-destructive-700",
  CANCELLED: "bg-background-secondary text-foreground-subtle",
};

function formatDate(d: Date): string {
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default async function LeavePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const employeeId = session.user.employeeId;
  const year = new Date().getFullYear();

  const [balancesResult, typesResult, requestsResult] = await Promise.all([
    getLeaveBalances(employeeId, year),
    listLeaveTypes(employeeId),
    listMyLeaveRequests(employeeId),
  ]);

  const balances = balancesResult.ok ? balancesResult.data : [];
  const leaveTypes = typesResult.ok ? typesResult.data : [];
  const requests = requestsResult.ok ? requestsResult.data : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">휴가</h1>
          <p className="mt-1 text-sm text-foreground-muted">{year}년 휴가 현황</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/leave/calendar">팀 캘린더</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/leave/requests">승인 관리</Link>
          </Button>
          <LeaveRequestButton leaveTypes={leaveTypes} />
        </div>
      </header>

      {balances.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-medium text-foreground-muted">잔여 휴가</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {balances.map((b) => (
              <div
                key={b.leaveTypeId}
                className="rounded-lg border border-border bg-background-primary p-4"
              >
                <p className="truncate text-sm text-foreground-muted">{b.leaveTypeName}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {b.remainingDays}
                  <span className="ml-1 text-sm font-normal text-foreground-subtle">일</span>
                </p>
                <p className="mt-1 text-xs text-foreground-subtle">
                  부여 {b.grantedDays} · 사용 {b.usedDays}
                  {b.adjustedDays !== 0 && ` · 조정 ${b.adjustedDays > 0 ? "+" : ""}${b.adjustedDays}`}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium text-foreground-muted">신청 내역</h2>
        {requests.length === 0 ? (
          <EmptyState
            icon={<CalendarOff />}
            title="신청 내역이 없어요"
            description="휴가 신청하기 버튼을 눌러 첫 신청을 해보세요."
          />
        ) : (
          <ul className="flex flex-col gap-1">
            {requests.map((r) => (
              <li
                key={r.id}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 rounded-lg border border-border bg-background-primary px-4 py-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">{r.leaveTypeName}</span>
                  <span className="text-sm text-foreground-muted">
                    {formatDate(r.startDate)} ~ {formatDate(r.endDate)}
                    {r.reason && <span className="ml-2 text-foreground-subtle">· {r.reason}</span>}
                  </span>
                </div>
                <span className="text-sm text-foreground-muted">{r.days}일</span>
                <span className={`rounded-md px-2 py-0.5 text-xs ${STATUS_CLASS[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
                {r.status === "PENDING" && (
                  <CancelLeaveButton requestId={r.id} />
                )}
                {r.status !== "PENDING" && <div />}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
