"use client";

import { useState } from "react";
import Link from "next/link";
import { ThumbsUp, Heart, Pin } from "lucide-react";
import type { LeaveBalanceSummary } from "@teamlet/modules/leave";
import type { PendingApprovalItem, DocumentListItem } from "@teamlet/modules/workflow";
import type { AnnouncementItem } from "@teamlet/modules/announcement";
import type { HomeEventItem } from "@teamlet/modules/employee";

const MONTH_KO = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function formatRelative(d: Date) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (diff < 60) return `${diff}분 전`;
  if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
  return `${Math.floor(diff / 1440)}일 전`;
}

// 디자인 feed.jsx SecDivider — 섹션 구분 헤더
function SecDivider({ label, count }: { label: string; count?: number }) {
  return (
    <div className="sec-divider">
      {label}
      {count != null && <span className="ct">{count}</span>}
      <span className="line" />
    </div>
  );
}

const REACTIONS = [
  { key: "clap", Icon: ThumbsUp },
  { key: "heart", Icon: Heart },
] as const;

function PostCard({ item }: { item: AnnouncementItem }) {
  const date = new Date(item.createdAt);
  const [counts, setCounts] = useState<Record<string, number>>({ clap: 0, heart: 0 });
  const [active, setActive] = useState<Record<string, boolean>>({});

  function toggle(key: string) {
    const on = !active[key];
    setActive((p) => ({ ...p, [key]: on }));
    setCounts((p) => ({ ...p, [key]: Math.max(0, (p[key] ?? 0) + (on ? 1 : -1)) }));
  }

  return (
    <article className="post">
      <div className="post-h">
        <div className="av">{item.authorName?.slice(-2) ?? "??"}</div>
        <div className="who-block">
          <div className="who">{item.authorName} <span className="role">· 공지사항</span></div>
          <div className="meta">{formatRelative(date)}</div>
        </div>
        {item.isPinned && (
          <span className="pin"><Pin size={11} strokeWidth={2} /> 고정</span>
        )}
      </div>
      <div className="post-b">
        <h3>{item.title}</h3>
        <div className="text">{item.content}</div>
      </div>
      <div className="post-f">
        {REACTIONS.map(({ key, Icon }) => (
          <button
            key={key}
            className="react"
            onClick={() => toggle(key)}
            style={active[key] ? { background: "var(--primary-soft)", color: "var(--primary)" } : {}}
          >
            <Icon size={14} /> {(counts[key] ?? 0) > 0 && <b>{counts[key]}</b>}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--fg-subtle)" }}>
          {MONTH_KO[date.getMonth()]} {date.getDate()}
        </span>
      </div>
    </article>
  );
}

function EventRow({ events, type }: { events: HomeEventItem[]; type: "birthday" | "join_anniversary" | "new_join" }) {
  if (events.length === 0) return null;
  const now = new Date();
  const mon = MONTH_KO[now.getMonth()];
  const day = now.getDate();

  if (type === "birthday") {
    const names = events.map((e) => e.name).join(", ");
    return (
      <Link href="/members" className="event-row">
        <div className="date"><div className="m">{mon}</div><div className="d">{day}</div></div>
        <div className="icon-c">🎂</div>
        <div className="copy">
          <div className="t">오늘 생일인 동료 {events.length}명 — <strong>{names}</strong></div>
          <div className="s">동료에게 축하 메시지를 전달해보세요</div>
        </div>
        <span className="more">전달하기 →</span>
      </Link>
    );
  }

  if (type === "new_join") {
    return (
      <>
        {events.map((e) => {
          const joinDate = new Date();
          joinDate.setDate(joinDate.getDate() - (e.daysAgo ?? 0));
          return (
            <Link key={e.employeeId} href={`/members/${e.employeeId}`} className="event-row">
              <div className="date">
                <div className="m">{MONTH_KO[joinDate.getMonth()]}</div>
                <div className="d">{joinDate.getDate()}</div>
              </div>
              <div className="icon-c">👋</div>
              <div className="copy">
                <div className="t">새로 합류한 동료 — <strong>{e.name}</strong>{e.departmentName && <span style={{ fontWeight: 400, color: "var(--fg-muted)" }}> ({e.departmentName})</span>}</div>
                <div className="s">{e.daysAgo === 0 ? "오늘 입사" : `${e.daysAgo}일 전 입사`} · 프로필 보고 인사 보내기</div>
              </div>
              <span className="more">프로필 →</span>
            </Link>
          );
        })}
      </>
    );
  }

  if (type === "join_anniversary") {
    return (
      <>
        {events.map((e) => (
          <Link key={e.employeeId} href={`/members/${e.employeeId}`} className="event-row">
            <div className="date"><div className="m">{mon}</div><div className="d">{day}</div></div>
            <div className="icon-c">🥂</div>
            <div className="copy">
              <div className="t"><strong>{e.name}</strong> 입사 {e.years}주년</div>
              <div className="s">함께한 {e.years}년을 축하해주세요</div>
            </div>
            <span className="more">축하하기 →</span>
          </Link>
        ))}
      </>
    );
  }

  return null;
}

export function FeedTab({
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
  // 오늘의 소식 = 오늘 기준 이벤트만 (신규합류는 당일 입사분만 → 하루 지나면 사라짐), 최대 3개
  const todayEvents = events
    .filter((e) =>
      e.eventType === "birthday" ||
      e.eventType === "join_anniversary" ||
      (e.eventType === "new_join" && (e.daysAgo ?? 0) === 0),
    )
    .slice(0, 3);
  const birthdays = todayEvents.filter((e) => e.eventType === "birthday");
  const newJoins = todayEvents.filter((e) => e.eventType === "new_join");
  const anniversaries = todayEvents.filter((e) => e.eventType === "join_anniversary");
  const hasEvents = todayEvents.length > 0;

  // 홈 피드 공지: 필독 있으면 필독1 + 최신1, 없으면 최신2 (최대 2개)
  const byDate = [...announcements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const pinned = byDate.find((a) => a.isPinned);
  const feedAnnouncements = (
    pinned
      ? [pinned, byDate.find((a) => a.id !== pinned.id)]
      : byDate.slice(0, 2)
  ).filter(Boolean) as AnnouncementItem[];

  return (
    <section>
      {/* 공지 — 인정은 별도 탭. 필독1+최신1 또는 최신2만 노출 */}
      <SecDivider label="공지" count={announcements.length || undefined} />
      {feedAnnouncements.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {feedAnnouncements.map((a) => <PostCard key={a.id} item={a} />)}
        </div>
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

      {/* 오늘의 소식 — 오늘 기준 이벤트(생일·입사기념일·당일 합류) */}
      {hasEvents && (
        <>
          <SecDivider label="오늘의 소식" count={todayEvents.length} />
          <EventRow events={birthdays} type="birthday" />
          <EventRow events={newJoins} type="new_join" />
          <EventRow events={anniversaries} type="join_anniversary" />
        </>
      )}
    </section>
  );
}
