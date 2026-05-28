import Link from "next/link";
import type { LeaveBalanceSummary } from "@teamlet/modules/leave";
import type { PendingApprovalItem, DocumentListItem } from "@teamlet/modules/workflow";
import type { AnnouncementItem } from "@teamlet/modules/announcement";

function formatRelative(d: Date) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (diff < 60) return `${diff}분 전`;
  if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
  return `${Math.floor(diff / 1440)}일 전`;
}

function KpiCard({
  label,
  value,
  unit,
  delta,
  href,
  warn,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  href: string;
  warn?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-[14px] border border-border bg-background-primary p-4 transition-colors hover:bg-background-secondary"
    >
      <span className="text-[12px] text-foreground-muted">{label}</span>
      <span className={`text-[22px] font-bold tabular-nums leading-tight tracking-tight ${warn ? "text-destructive-600" : "text-foreground"}`}>
        {value}
        {unit && <small className="ml-1 text-[12px] font-normal text-foreground-muted">{unit}</small>}
      </span>
      {delta && <span className="text-[12px] text-foreground-muted">{delta}</span>}
    </Link>
  );
}

function PostCard({ item, currentEmployeeId }: { item: AnnouncementItem; currentEmployeeId?: string | null }) {
  return (
    <article className="overflow-hidden rounded-[16px] border border-border bg-background-primary transition-shadow hover:shadow-sm mb-3.5">
      <div className="flex items-center gap-3 px-5 pt-4 pb-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background-secondary text-xs font-semibold text-foreground">
          {item.authorName?.slice(-2) ?? "??"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-foreground truncate">{item.authorName}</div>
          <div className="text-[12px] text-foreground-muted">{formatRelative(item.createdAt)} · 공지사항</div>
        </div>
        {item.isPinned && (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
            📌 필독
          </span>
        )}
      </div>
      <div className="px-5 pb-4">
        <h3 className="mb-1.5 text-[16px] font-bold leading-snug tracking-tight">{item.title}</h3>
        <p className="line-clamp-3 text-[13.5px] leading-relaxed text-foreground-muted">{item.content}</p>
      </div>
    </article>
  );
}

export function FeedTab({
  employeeId,
  pending,
  balances,
  myDocs,
  annualBalance,
  announcements,
  year,
}: {
  employeeId: string | undefined | null;
  pending: PendingApprovalItem[];
  balances: LeaveBalanceSummary[];
  myDocs: DocumentListItem[];
  annualBalance: LeaveBalanceSummary | undefined;
  announcements: AnnouncementItem[];
  year: number;
}) {
  const inProgressDocs = myDocs.filter((d) => d.status === "IN_PROGRESS").length;
  const urgentCount = pending.filter(
    (p) => Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 86400000) >= 3
  ).length;

  return (
    <section className="flex flex-col">
      {/* KPI 카드 */}
      {employeeId && (
        <div className="mb-5 grid grid-cols-4 gap-3">
          <KpiCard
            label="연차 잔여"
            value={annualBalance ? annualBalance.remainingDays : "—"}
            unit={annualBalance ? `/ ${annualBalance.grantedDays}일` : undefined}
            delta={annualBalance ? `사용 ${annualBalance.usedDays}일` : "잔여 정보 없음"}
            href="/leave"
            warn={!!annualBalance && annualBalance.remainingDays <= 3}
          />
          <KpiCard
            label="결재 대기"
            value={pending.length}
            unit="건"
            delta={pending.length > 0 ? "바로 처리 →" : "처리 완료"}
            href="/workflow"
            warn={pending.length > 0}
          />
          <KpiCard
            label="진행 중 문서"
            value={inProgressDocs}
            unit="건"
            delta="내가 기안한 문서"
            href="/workflow"
          />
          <KpiCard
            label="처리 지연"
            value={urgentCount}
            unit="건"
            delta={urgentCount > 0 ? "즉시 처리 필요" : "지연 없음"}
            href="/home?tab=tasks"
            warn={urgentCount > 0}
          />
        </div>
      )}

      {/* 결재 대기 배너 */}
      {pending.length > 0 && (
        <div className="mb-5 overflow-hidden rounded-[14px] border border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-amber-800">결재 대기</span>
              <span className="rounded-full bg-amber-200 px-2 py-0.5 font-mono text-[10.5px] font-bold text-amber-800">
                {pending.length}
              </span>
            </div>
            <Link href="/workflow" className="text-[12px] text-amber-700 hover:text-amber-900">
              전체 보기 →
            </Link>
          </div>
          <ul className="flex flex-col divide-y divide-amber-100">
            {pending.slice(0, 3).map((item) => (
              <li key={item.id}>
                <Link
                  href={`/workflow/documents/${item.documentId}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-amber-100/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-foreground">{item.documentTitle}</p>
                    <p className="text-[11.5px] text-foreground-muted mt-0.5">
                      {item.authorName} · {item.step}/{item.totalSteps}단계
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 text-amber-700 text-[12px]">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 공지 피드 */}
      {announcements.length > 0 ? (
        announcements.slice(0, 5).map((a) => (
          <PostCard key={a.id} item={a} currentEmployeeId={employeeId} />
        ))
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-[14px] border border-border bg-background-primary py-12 text-center">
          <p className="text-[14px] font-medium text-foreground">등록된 공지사항이 없어요</p>
          <p className="text-[12.5px] text-foreground-muted">팀의 소식을 공유해 보세요.</p>
        </div>
      )}
    </section>
  );
}
