import Link from "next/link";
import { Calendar, Users, Coffee, Sparkles } from "lucide-react";
import type { LeaveBalanceSummary, CalendarLeaveItem } from "@teamlet/modules/leave";
import type { HomeEventItem } from "@teamlet/modules/employee";
import type { HolidayItem } from "@teamlet/modules/tenancy";
import { MiniCalendar } from "./mini-calendar";

export function HomeRail({
  todayAbsent = [],
  events = [],
  activeCount = 0,
  holidays = [],
  monthCalendar = [],
}: {
  balances: LeaveBalanceSummary[];
  annualBalance: LeaveBalanceSummary | undefined;
  todayAbsent?: CalendarLeaveItem[];
  events?: HomeEventItem[];
  activeCount?: number;
  holidays?: HolidayItem[];
  monthCalendar?: CalendarLeaveItem[];
}) {
  const birthdays = events.filter((e) => e.eventType === "birthday");
  const anniversaries = events.filter((e) => e.eventType === "join_anniversary");
  const celebrateList = [...birthdays, ...anniversaries];

  const workingCount = Math.max(0, activeCount - todayAbsent.length);

  // 이번 달 휴가 범위 (캘린더용)
  const leaveRanges = monthCalendar.map((r) => ({ startDate: r.startDate, endDate: r.endDate }));

  // 이벤트 날짜 (생일/기념일 dot용)
  const eventDates = events.map(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  return (
    <aside className="rail-h">
      {/* 이번 달 일정 — 디자인 순서상 캘린더 먼저 */}
      <div className="widget">
        <h5>
          <Calendar size={14} strokeWidth={1.9} /> 이번 달 일정
          <Link href="/leave/calendar" className="all">월 보기 →</Link>
        </h5>
        <MiniCalendar
          holidays={holidays}
          leaveRanges={leaveRanges}
          eventDates={eventDates}
        />
      </div>

      {/* 오늘 근무 현황 */}
      <div className="widget">
        <h5>
          <Users size={14} strokeWidth={1.9} /> 오늘 근무 현황
          <Link href="/members" className="all">전체 →</Link>
        </h5>
        <div className="today-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="cell">
            <div className="n num">{String(workingCount).padStart(2, "0")}</div>
            <div className="l">출근</div>
          </div>
          <div className="cell">
            <div className="n num">{String(todayAbsent.length).padStart(2, "0")}</div>
            <div className="l">휴가</div>
          </div>
        </div>
      </div>

      {/* 오늘 자리비움 */}
      {todayAbsent.length > 0 && (
        <div className="widget">
          <h5>
            <Coffee size={14} strokeWidth={1.9} /> 오늘 자리비움
            <span className="all">{todayAbsent.length}명</span>
          </h5>
          <div className="ooo">
            {todayAbsent.slice(0, 6).map((r) => (
              <div key={r.id} className="row">
                <div className="av sm">{r.employeeName.slice(-2)}</div>
                <span style={{ flex: 1, fontWeight: 600, fontSize: "13px" }}>{r.employeeName}</span>
                <span className="tag lv">{r.leaveTypeName}</span>
              </div>
            ))}
            {todayAbsent.length > 6 && (
              <div style={{ fontSize: "12px", color: "var(--fg-muted)", textAlign: "center", paddingTop: "4px" }}>
                +{todayAbsent.length - 6}명 더
              </div>
            )}
          </div>
        </div>
      )}

      {/* 축하 보낼 동료 */}
      {celebrateList.length > 0 && (
        <div className="widget">
          <h5><Sparkles size={14} strokeWidth={1.9} /> 축하 보낼 동료</h5>
          <div className="b-list">
            {birthdays.map((e) => (
              <div key={e.employeeId} className="b">
                <div className="av sm">{e.name.slice(-2)}</div>
                <div className="info">
                  <div className="nm">{e.name}</div>
                  <div className="sub-b">생일</div>
                </div>
                <div className="when today">오늘</div>
              </div>
            ))}
            {anniversaries.map((e) => (
              <div key={e.employeeId} className="b">
                <div className="av sm">{e.name.slice(-2)}</div>
                <div className="info">
                  <div className="nm">{e.name}</div>
                  <div className="sub-b">입사 {e.years}주년</div>
                </div>
                <div className="when today">오늘</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
