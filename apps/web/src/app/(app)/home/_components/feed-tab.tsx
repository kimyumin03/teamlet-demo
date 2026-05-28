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

function PostCard({ item }: { item: AnnouncementItem }) {
  return (
    <article className="post">
      <div className="post-h">
        <div className="av">{item.authorName?.slice(-2) ?? "??"}</div>
        <div className="who-block">
          <div className="who">{item.authorName} <span className="role">· 공지사항</span></div>
          <div className="meta">{formatRelative(item.createdAt)}</div>
        </div>
        {item.isPinned && <span className="pin">📌 필독</span>}
      </div>
      <div className="post-b">
        <h3>{item.title}</h3>
        <div className="text">{item.content}</div>
      </div>
    </article>
  );
}

export function FeedTab({
  employeeId,
  pending,
  myDocs,
  annualBalance,
  announcements,
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
    <section>
      {/* KPI 카드 */}
      {employeeId && (
        <div className="kpis">
          <Link href="/leave" className="kpi">
            <span className="lbl">연차 잔여</span>
            <span className="val num">
              {annualBalance?.remainingDays ?? "—"}
              {annualBalance && <small>/ {annualBalance.grantedDays}일</small>}
            </span>
            <span className="delta">사용 {annualBalance?.usedDays ?? 0}일</span>
          </Link>
          <Link href="/workflow" className={`kpi${pending.length > 0 ? " cta" : ""}`}>
            <span className="lbl">결재 대기</span>
            <span className="val num">{pending.length}<small>건</small></span>
            <span className="delta">
              {pending.length > 0 ? `마감 임박 ${urgentCount} · 일반 ${pending.length - urgentCount}` : "모두 처리됐어요"}
            </span>
          </Link>
          <Link href="/workflow" className="kpi">
            <span className="lbl">진행 중 문서</span>
            <span className="val num">{inProgressDocs}<small>건</small></span>
            <span className="delta">내가 기안한 문서</span>
          </Link>
          <Link href="/home?tab=tasks" className="kpi">
            <span className="lbl">처리 지연</span>
            <span className="val num">{urgentCount}<small>건</small></span>
            <span className="delta">{urgentCount > 0 ? "즉시 처리 필요" : "지연 없음"}</span>
          </Link>
        </div>
      )}

      {/* 공지 피드 */}
      {announcements.length > 0 ? (
        announcements.slice(0, 6).map((a) => (
          <PostCard key={a.id} item={a} />
        ))
      ) : (
        <div style={{
          padding: "48px 20px", textAlign: "center",
          border: "1px dashed var(--border)", borderRadius: "14px",
          color: "var(--fg-muted)",
        }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--fg)", marginBottom: "6px" }}>
            등록된 공지사항이 없어요
          </div>
          <div style={{ fontSize: "12.5px" }}>팀의 소식을 공유해 보세요.</div>
        </div>
      )}
    </section>
  );
}
