import Link from "next/link";
import type { LeaveBalanceSummary } from "@teamlet/modules/leave";

function BalanceCard({ b }: { b: LeaveBalanceSummary }) {
  const usedPct = b.grantedDays > 0 ? Math.min(100, (b.usedDays / b.grantedDays) * 100) : 0;
  const isLow = b.remainingDays > 0 && b.remainingDays <= 3;
  const isExhausted = b.remainingDays <= 0;

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border bg-background-primary p-5 ${
        isExhausted
          ? "border-destructive-200"
          : isLow
          ? "border-amber-200"
          : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-foreground-muted">{b.leaveTypeName}</p>
        {isLow && !isExhausted && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            잔여 부족
          </span>
        )}
        {isExhausted && (
          <span className="shrink-0 rounded-full bg-destructive-50 px-2 py-0.5 text-[10px] font-medium text-destructive-700">
            소진
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span
          className={`text-3xl font-bold tabular-nums ${
            isExhausted ? "text-destructive-600" : isLow ? "text-amber-700" : "text-foreground"
          }`}
        >
          {b.remainingDays}
        </span>
        <span className="text-sm text-foreground-subtle">일 남음</span>
      </div>

      {/* 진행 바 */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-background-secondary">
        <div
          className={`h-full rounded-full transition-all ${
            isExhausted ? "bg-destructive-400" : isLow ? "bg-amber-400" : "bg-foreground"
          }`}
          style={{ width: `${usedPct}%` }}
        />
      </div>

      <p className="text-xs text-foreground-subtle">
        부여 {b.grantedDays}일 · 사용 {b.usedDays}일
        {b.adjustedDays !== 0 && (
          <span className="ml-1">
            · 조정 {b.adjustedDays > 0 ? "+" : ""}
            {b.adjustedDays}일
          </span>
        )}
      </p>
    </div>
  );
}

export function BalanceSection({
  balances,
  year,
}: {
  balances: LeaveBalanceSummary[];
  year: number;
}) {
  const totalGranted = balances.reduce((s, b) => s + b.grantedDays, 0);
  const totalUsed = balances.reduce((s, b) => s + b.usedDays, 0);
  const totalRemaining = balances.reduce((s, b) => s + b.remainingDays, 0);

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground-muted">{year}년 잔여 현황</h2>
        {balances.length > 0 && (
          <p className="text-xs text-foreground-subtle">
            총 {totalGranted}일 부여 · {totalUsed}일 사용 · {totalRemaining}일 잔여
          </p>
        )}
      </div>

      {balances.length === 0 ? (
        <div className="rounded-xl border border-border bg-background-primary p-8 text-center">
          <p className="text-sm text-foreground-muted">부여된 휴가 정보가 없어요.</p>
          <p className="mt-1 text-xs text-foreground-subtle">
            관리자에게 연차 부여를 요청해 주세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {balances.map((b) => (
            <BalanceCard key={b.leaveTypeId} b={b} />
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Link
          href="/leave/calendar"
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground"
        >
          팀 캘린더 보기 →
        </Link>
        <Link
          href="/leave/requests"
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground"
        >
          승인 관리 →
        </Link>
      </div>
    </section>
  );
}
