import Link from "next/link";
import type { AnnouncementItem } from "@teamlet/modules/announcement";
import { CreateAnnouncementButton } from "@/components/announcement/create-announcement-button";
import { AnnouncementActions } from "@/components/announcement/announcement-actions";
import { AnnouncementComments } from "@/components/announcement/announcement-comments";

function formatRelative(d: Date) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (diff < 60) return `${diff}분 전`;
  if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
  return `${Math.floor(diff / 1440)}일 전`;
}

function isThisWeek(d: Date) {
  const now = Date.now();
  return now - new Date(d).getTime() < 7 * 24 * 60 * 60 * 1000;
}

export function NewsTab({
  subTab = "notice",
  announcements,
  currentEmployeeId,
}: {
  subTab?: string;
  announcements: AnnouncementItem[];
  currentEmployeeId?: string;
}) {
  const thisWeekCount = announcements.filter((a) => isThisWeek(a.createdAt)).length;
  const pinnedCount = announcements.filter((a) => a.isPinned).length;

  return (
    <section>
      {/* 서브탭 */}
      <div className="tabs">
        <Link href="/home?tab=news&view=notice" className={`tab${subTab === "notice" ? " active" : ""}`}>
          공지사항
          {announcements.length > 0 && <span className="count">{announcements.length}</span>}
        </Link>
        <Link href="/home?tab=news&view=recognition" className={`tab${subTab === "recognition" ? " active" : ""}`}>
          인정
        </Link>
      </div>

      {subTab === "notice" && (
        <div>
          {/* 2열 KPI */}
          <div className="kpis" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: "16px" }}>
            <div className="kpi">
              <span className="lbl">읽지 않은 공지</span>
              <span className="val num">{announcements.length}<small>건</small></span>
            </div>
            <div className="kpi">
              <span className="lbl">이번 주 새 글</span>
              <span className="val num">{thisWeekCount}<small>건</small></span>
              {pinnedCount > 0 && <span className="delta">📌 필독 {pinnedCount}건</span>}
            </div>
          </div>
          {/* 작성 버튼 */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
            <CreateAnnouncementButton />
          </div>

          {announcements.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "14px", color: "var(--fg-muted)" }}>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--fg)", marginBottom: "6px" }}>등록된 공지사항이 없어요</div>
              <div style={{ fontSize: "12.5px" }}>회사 공지사항을 작성하면 전 구성원에게 전달됩니다.</div>
            </div>
          ) : (
            announcements.map((item) => (
              <article key={item.id} className="post">
                <div className="post-h">
                  <div className="av">{item.authorName?.slice(-2) ?? "??"}</div>
                  <div className="who-block">
                    <div className="who">
                      {item.authorName}
                      <span className="role"> · 공지사항</span>
                    </div>
                    <div className="meta">{formatRelative(item.createdAt)}</div>
                  </div>
                  {item.isPinned && <span className="pin">📌 필독</span>}
                  {currentEmployeeId === item.authorId && (
                    <AnnouncementActions id={item.id} title={item.title} content={item.content} isPinned={item.isPinned} />
                  )}
                </div>
                <div className="post-b">
                  <h3>{item.title}</h3>
                  <div className="text">{item.content}</div>
                </div>
                {currentEmployeeId && (
                  <AnnouncementComments
                    announcementId={item.id}
                    initialCount={item.commentCount}
                    currentEmployeeId={currentEmployeeId}
                  />
                )}
              </article>
            ))
          )}
        </div>
      )}

      {subTab === "recognition" && (
        <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "14px", color: "var(--fg-muted)" }}>
          <div style={{ fontSize: "28px", marginBottom: "12px" }}>👏</div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--fg)", marginBottom: "6px" }}>아직 인정이 없어요</div>
          <div style={{ fontSize: "12.5px" }}>동료의 멋진 점을 인정해 주세요. 조직 문화가 좋아져요.</div>
        </div>
      )}
    </section>
  );
}
