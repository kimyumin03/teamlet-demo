import Link from "next/link";
import type { LeaveBalanceSummary } from "@teamlet/modules/leave";
import type { PendingApprovalItem, DocumentListItem } from "@teamlet/modules/workflow";
import type { NotificationItem } from "@teamlet/modules/notification";
import { MiniCalendar } from "./mini-calendar";

const STATUS_CLASS: Record<string, string> = {
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  APPROVED: "bg-background-secondary text-foreground-muted",
  REJECTED: "bg-destructive-50 text-destructive-700",
  DRAFT: "bg-background-secondary text-foreground-subtle",
  CANCELLED: "bg-background-secondary text-foreground-subtle",
};
const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: "진행중",
  APPROVED: "승인",
  REJECTED: "반려",
  DRAFT: "임시저장",
  CANCELLED: "취소",
};

const KIND_LABEL: Record<string, string> = {
  LEAVE_REQUEST: "휴가",
  NOTICE: "공지",
  GENERAL: "일반",
  INFO_CHANGE: "정보변경",
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

function StatCard({
  label,
  value,
  sub,
  href,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  href: string;
  accent?: "amber" | "blue" | "default";
}) {
  const accentClass =
    accent === "amber"
      ? "border-amber-200 hover:bg-amber-50/30"
      : accent === "blue"
      ? "border-blue-100 hover:bg-blue-50/20"
      : "hover:bg-background-secondary";

  return (
    <Link
      href={href}
      className={`flex flex-col gap-1.5 rounded-xl border border-border bg-background-primary p-5 transition-colors ${accentClass}`}
    >
      <p className="text-xs text-foreground-subtle">{label}</p>
      <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
      {sub && <p className="text-xs text-foreground-muted">{sub}</p>}
    </Link>
  );
}

export function FeedTab({
  employeeId,
  pending,
  balances,
  myDocs,
  notifications,
  annualBalance,
  year,
}: {
  employeeId: string | undefined | null;
  pending: PendingApprovalItem[];
  balances: LeaveBalanceSummary[];
  myDocs: DocumentListItem[];
  notifications: NotificationItem[];
  annualBalance: LeaveBalanceSummary | undefined;
  year: number;
}) {
  const recentDocs = myDocs.slice(0, 6);
  const inProgressDocs = myDocs.filter((d) => d.status === "IN_PROGRESS").length;
  const unreadCount = notifications.length;

  return (
    <div className="flex flex-col gap-6">
      {/* 요약 카드 */}
      {employeeId && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="결재 대기"
            value={pending.length}
            sub={pending.length > 0 ? `${pending.length}건 승인 필요` : "처리 완료"}
            href="/workflow"
            accent={pending.length > 0 ? "amber" : "default"}
          />
          <StatCard
            label={`연차 잔여 (${year})`}
            value={annualBalance ? `${annualBalance.remainingDays}일` : "—"}
            sub={
              annualBalance
                ? `총 ${annualBalance.grantedDays}일 · 사용 ${annualBalance.usedDays}일`
                : "잔여 정보 없음"
            }
            href="/leave"
            accent="blue"
          />
          <StatCard
            label="진행 중 문서"
            value={inProgressDocs}
            sub="내가 기안한 문서"
            href="/workflow"
          />
          <StatCard
            label="안 읽은 알림"
            value={unreadCount}
            sub={unreadCount > 0 ? "확인해 주세요" : "새 알림 없음"}
            href="/workflow"
            accent={unreadCount > 0 ? "amber" : "default"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_288px]">
        {/* 왼쪽: 피드 */}
        <div className="flex flex-col gap-5">
          {/* 결재 대기 */}
          {pending.length > 0 && (
            <section className="rounded-xl border border-amber-200 bg-amber-50/30 overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">결재 대기</h2>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {pending.length}
                  </span>
                </div>
                <Link href="/workflow" className="text-xs text-foreground-muted hover:text-foreground">
                  전체 보기 →
                </Link>
              </div>
              <ul className="flex flex-col divide-y divide-amber-100">
                {pending.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/workflow/documents/${item.documentId}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-amber-50/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{item.documentTitle}</p>
                        <p className="text-xs text-foreground-muted mt-0.5">
                          {item.authorName} · {item.step}/{item.totalSteps}단계 · {formatDate(item.createdAt)}
                        </p>
                      </div>
                      <span className="ml-3 shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        승인 필요
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {pending.length > 5 && (
                <div className="border-t border-amber-100 px-5 py-2.5">
                  <Link href="/workflow" className="text-xs text-amber-700 hover:text-amber-900">
                    + {pending.length - 5}건 더 보기
                  </Link>
                </div>
              )}
            </section>
          )}

          {/* 최근 문서 */}
          <section className="rounded-xl border border-border bg-background-primary overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-sm font-semibold text-foreground">최근 문서</h2>
              <Link href="/workflow" className="text-xs text-foreground-muted hover:text-foreground">
                전체 보기 →
              </Link>
            </div>
            {recentDocs.length === 0 ? (
              <div className="px-5 pb-6 text-center">
                <p className="text-sm text-foreground-muted">작성한 문서가 없어요.</p>
                <Link
                  href="/workflow"
                  className="mt-2 inline-block text-xs text-primary hover:underline"
                >
                  첫 문서 기안하기 →
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {recentDocs.map((doc) => (
                  <li key={doc.id}>
                    <Link
                      href={`/workflow/documents/${doc.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-background-secondary transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {doc.kind in KIND_LABEL && (
                            <span className="shrink-0 rounded bg-background-secondary px-1.5 py-0.5 text-[10px] text-foreground-subtle">
                              {KIND_LABEL[doc.kind]}
                            </span>
                          )}
                          <p className="truncate text-sm font-medium text-foreground">{doc.title}</p>
                        </div>
                        <p className="text-xs text-foreground-muted mt-0.5">
                          {formatDate(doc.createdAt)} ·{" "}
                          {doc.currentStep !== null
                            ? `${doc.currentStep}/${doc.totalSteps}단계`
                            : `총 ${doc.totalSteps}단계`}
                        </p>
                      </div>
                      <span
                        className={`ml-3 shrink-0 rounded-md px-2 py-0.5 text-xs ${STATUS_CLASS[doc.status] ?? "text-foreground-muted"}`}
                      >
                        {STATUS_LABEL[doc.status] ?? doc.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 알림 (안 읽은 것) */}
          {notifications.length > 0 && (
            <section className="rounded-xl border border-border bg-background-primary overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <h2 className="text-sm font-semibold text-foreground">새 알림</h2>
              </div>
              <ul className="flex flex-col divide-y divide-border">
                {notifications.slice(0, 4).map((n) => (
                  <li key={n.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-foreground-muted mt-0.5">{n.body}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* 오른쪽 사이드바 */}
        <div className="flex flex-col gap-5">
          {/* 미니 캘린더 */}
          <section className="rounded-xl border border-border bg-background-primary p-5">
            <MiniCalendar />
          </section>

          {/* 휴가 잔여 */}
          {balances.length > 0 && (
            <section className="rounded-xl border border-border bg-background-primary overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="text-sm font-semibold text-foreground">휴가 잔여</h2>
                <Link href="/leave" className="text-xs text-foreground-muted hover:text-foreground">
                  신청 →
                </Link>
              </div>
              <ul className="flex flex-col divide-y divide-border">
                {balances.slice(0, 5).map((b) => (
                  <li
                    key={b.leaveTypeId}
                    className="flex items-center justify-between px-5 py-2.5"
                  >
                    <span className="text-sm text-foreground">{b.leaveTypeName}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {b.remainingDays}일
                      </span>
                      <span className="ml-1 text-xs text-foreground-subtle">/ {b.grantedDays}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
