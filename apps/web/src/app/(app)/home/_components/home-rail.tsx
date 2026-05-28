import Link from "next/link";
import type { LeaveBalanceSummary } from "@teamlet/modules/leave";
import { MiniCalendar } from "./mini-calendar";

export function HomeRail({
  balances,
  annualBalance,
}: {
  balances: LeaveBalanceSummary[];
  annualBalance: LeaveBalanceSummary | undefined;
}) {
  return (
    <aside className="flex flex-col gap-3.5 border-l border-border bg-background px-6 py-7">
      {/* 연차 잔여 */}
      {annualBalance && (
        <div className="rounded-[14px] border border-border bg-background-primary p-4">
          <div className="mb-3 flex items-center justify-between">
            <h5 className="text-[12px] font-semibold uppercase tracking-wide text-foreground-muted">
              연차 잔여
            </h5>
            <Link
              href="/leave"
              className="font-mono text-[11px] text-foreground-subtle hover:text-primary transition-colors"
            >
              신청 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[10px] border border-border bg-background-secondary px-3 py-2.5">
              <div className="text-[18px] font-bold tabular-nums leading-tight">
                {annualBalance.remainingDays}
              </div>
              <div className="mt-1 text-[11.5px] font-medium text-foreground-muted">잔여</div>
            </div>
            <div className="rounded-[10px] border border-border bg-background-secondary px-3 py-2.5">
              <div className="text-[18px] font-bold tabular-nums leading-tight">
                {annualBalance.usedDays}
              </div>
              <div className="mt-1 text-[11.5px] font-medium text-foreground-muted">사용</div>
            </div>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-background-tertiary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${Math.min(100, (annualBalance.usedDays / (annualBalance.grantedDays || 1)) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-1.5 font-mono text-[11px] text-foreground-subtle">
            총 {annualBalance.grantedDays}일 부여
          </p>
        </div>
      )}

      {/* 미니 캘린더 */}
      <div className="rounded-[14px] border border-border bg-background-primary p-4">
        <div className="mb-3 flex items-center justify-between">
          <h5 className="text-[12px] font-semibold uppercase tracking-wide text-foreground-muted">
            이번 달 일정
          </h5>
          <span className="font-mono text-[11px] text-foreground-subtle">월 보기 →</span>
        </div>
        <MiniCalendar />
      </div>

      {/* 기타 휴가 잔여 */}
      {balances.filter((b) => b.leaveTypeKey !== "annual" && b.remainingDays > 0).length > 0 && (
        <div className="rounded-[14px] border border-border bg-background-primary p-4">
          <h5 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-foreground-muted">
            기타 휴가
          </h5>
          <div className="flex flex-col divide-y divide-border">
            {balances
              .filter((b) => b.leaveTypeKey !== "annual" && b.remainingDays > 0)
              .slice(0, 4)
              .map((b) => (
                <div key={b.leaveTypeId} className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-foreground">{b.leaveTypeName}</span>
                  <span className="font-mono text-[13px] font-bold tabular-nums">
                    {b.remainingDays}
                    <span className="ml-0.5 text-[11px] font-normal text-foreground-muted">일</span>
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </aside>
  );
}
