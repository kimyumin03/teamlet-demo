import Link from "next/link";
import type { LeaveBalanceSummary } from "@teamlet/modules/leave";
import type { PendingApprovalItem, DocumentListItem } from "@teamlet/modules/workflow";
import type { AnnouncementItem } from "@teamlet/modules/announcement";
import type { HomeEventItem } from "@teamlet/modules/employee";

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

function EventCard({ events, type }: { events: HomeEventItem[]; type: "birthday" | "join_anniversary" | "new_join" }) {
  if (events.length === 0) return null;

  if (type === "birthday") {
    const names = events.map((e) => e.name).join(", ");
    return (
      <div className="event-card">
        <span className="event-icon">🎂</span>
        <div className="event-body">
          <div className="event-title">
            오늘 생일인 동료 {events.length}명 — <strong>{names}</strong>
          </div>
          <div className="event-desc">동료에게 축하 메시지를 전달해보세요</div>
        </div>
        <Link href="/members" className="event-btn">전달하기 →</Link>
      </div>
    );
  }

  if (type === "new_join") {
    return (
      <>
        {events.map((e) => (
          <div key={e.employeeId} className="event-card">
            <span className="event-icon">👋</span>
            <div className="event-body">
              <div className="event-title">
                새로 합류한 동료 — <strong>{e.name}</strong>
                {e.departmentName && <span className="event-dept"> ({e.departmentName})</span>}
              </div>
              <div className="event-desc">
                {e.daysAgo === 0 ? "오늘 입사" : `${e.daysAgo}일 전 입사`} · 프로필 보고 인사 보내기
              </div>
            </div>
            <Link href="/members" className="event-btn">프로필 →</Link>
          </div>
        ))}
      </>
    );
  }

  if (type === "join_anniversary") {
    return (
      <>
        {events.map((e) => (
          <div key={e.employeeId} className="event-card">
            <span className="event-icon">🥂</span>
            <div className="event-body">
              <div className="event-title">
                <strong>{e.name}</strong> 입사 {e.years}주년
              </div>
              <div className="event-desc">함께한 {e.years}년을 축하해주세요</div>
            </div>
            <Link href="/members" className="event-btn">축하하기 →</Link>
          </div>
        ))}
      </>
    );
  }

  return null;
}

export function FeedTab({
  employeeId,
  pending,
  myDocs,
  annualBalance,
  announcements,
  events = [],
}: {
  employeeId: string | undefined | null;
  pending: PendingApprovalItem[];
  balances: LeaveBalanceSummary[];
  myDocs: DocumentListItem[];
  annualBalance: LeaveBalanceSummary | undefined;
  announcements: AnnouncementItem[];
  events?: HomeEventItem[];
  year: number;
}) {
  const inProgressDocs = myDocs.filter((d) => d.status === "IN_PROGRESS").length;
  const urgentCount = pending.filter(
    (p) => Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 86400000) >= 3
  ).length;

  const birthdays = events.filter((e) => e.eventType === "birthday");
  const newJoins = events.filter((e) => e.eventType === "new_join");
  const anniversaries = events.filter((e) => e.eventType === "join_anniversary");

  return (
    <section>
      {/* KPI 4장 — 디자인 기준 */}
      {employeeId && (
        <div className="kpis">
          <Link href="/leave" className="kpi">
            <span className="lbl">연차 잔여</span>
            <span className="val num">
              {annualBalance?.remainingDays ?? "—"}
              {annualBalance && <small>/ {annualBalance.grantedDays}일</small>}
            </span>
            <span className="delta">사용 {annualBalance?.usedDays ?? 0}일 · 휴가 신청 →</span>
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
            <span className="delta">내가 기안한 문서 →</span>
          </Link>
          <Link href="/home?tab=tasks" className={`kpi${urgentCount > 0 ? " cta" : ""}`}>
            <span className="lbl">오늘 할 일</span>
            <span className="val num">{pending.length + inProgressDocs}<small>건</small></span>
            <span className="delta">
              {urgentCount > 0 ? `마감 임박 ${urgentCount}건` : "할 일 탭 열기 →"}
            </span>
          </Link>
        </div>
      )}

      {/* 이벤트 카드 — 생일 / 신규 합류 / 입사 기념일 */}
      <EventCard events={birthdays} type="birthday" />
      <EventCard events={newJoins} type="new_join" />
      <EventCard events={anniversaries} type="join_anniversary" />

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
