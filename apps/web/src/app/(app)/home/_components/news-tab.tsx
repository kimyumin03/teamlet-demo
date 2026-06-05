import type { AnnouncementItem } from "@teamlet/modules/announcement";
import { MarkAnnouncementsRead } from "@/components/announcement/mark-announcements-read";
import { AnnouncementPagedList } from "./announcement-paged-list";

function isThisWeek(d: Date) {
  const now = Date.now();
  return now - new Date(d).getTime() < 7 * 24 * 60 * 60 * 1000;
}

export function NewsTab({
  announcements,
  currentEmployeeId,
  unreadCount = 0,
}: {
  announcements: AnnouncementItem[];
  currentEmployeeId?: string;
  unreadCount?: number;
}) {
  const thisWeekCount = announcements.filter((a) => isThisWeek(a.createdAt)).length;
  const pinnedCount = announcements.filter((a) => a.isPinned).length;

  return (
    <section>
      {/* 탭 진입 시 공지 읽음 처리 */}
      <MarkAnnouncementsRead />
      {/* 2열 KPI */}
      <div className="kpis" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: "16px" }}>
        <div className="kpi">
          <span className="lbl">읽지 않은 공지</span>
          <span className="val num">{unreadCount}<small>건</small></span>
        </div>
        <div className="kpi">
          <span className="lbl">이번 주 새 글</span>
          <span className="val num">{thisWeekCount}<small>건</small></span>
          {pinnedCount > 0 && <span className="delta">📌 필독 {pinnedCount}건</span>}
        </div>
      </div>

      {announcements.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "14px", color: "var(--fg-muted)" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--fg)", marginBottom: "6px" }}>등록된 공지사항이 없어요</div>
          <div style={{ fontSize: "12.5px" }}>회사 공지사항을 작성하면 전 구성원에게 전달됩니다.</div>
        </div>
      ) : (
        <AnnouncementPagedList announcements={announcements} currentEmployeeId={currentEmployeeId} />
      )}
    </section>
  );
}
