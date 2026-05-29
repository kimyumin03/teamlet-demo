"use client";

import { useState } from "react";
import Link from "next/link";
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

const REACTIONS = [
  { key: "clap", emoji: "👏" },
  { key: "heart", emoji: "❤️" },
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
        {item.isPinned && <span className="pin">📌 필독</span>}
      </div>
      <div className="post-b">
        <h3>{item.title}</h3>
        <div className="text">{item.content}</div>
      </div>
      <div className="post-f">
        {REACTIONS.map((r) => (
          <button
            key={r.key}
            className="react"
            onClick={() => toggle(r.key)}
            style={active[r.key] ? { background: "var(--primary-soft)", outline: "1.5px solid var(--primary)" } : {}}
          >
            {r.emoji} {(counts[r.key] ?? 0) > 0 && <b>{counts[r.key]}</b>}
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
      {/* KPI 4장 */}
      {employeeId && (
        <div className="kpis">
          <Link href="/leave" className="kpi">
            <span className="lbl">연차 잔여</span>
            <span className="val num">
              {annualBalance?.remainingDays ?? "—"}
              {annualBalance && <small>/ {annualBalance.grantedDays}일</small>}
            </span>
            <span className="delta">휴가 신청 →</span>
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

      {/* 이벤트 행 */}
      <EventRow events={birthdays} type="birthday" />
      <EventRow events={newJoins} type="new_join" />
      <EventRow events={anniversaries} type="join_anniversary" />

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
