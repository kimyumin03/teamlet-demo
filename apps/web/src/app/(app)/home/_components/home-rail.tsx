import Link from "next/link";
import type { LeaveBalanceSummary, CalendarLeaveItem } from "@teamlet/modules/leave";
import type { HomeEventItem } from "@teamlet/modules/employee";
import type { HolidayItem } from "@teamlet/modules/tenancy";
import { MiniCalendar } from "./mini-calendar";

function isToday(d: Date) {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isThisWeek(d: Date) {
  const now = new Date();
  const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1); mon.setHours(0,0,0,0);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);
  return d >= mon && d <= sun;
}

export function HomeRail({
  annualBalance,
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

  const wfhCount = todayAbsent.filter((r) =>
    /재택|wfh|remote/i.test(r.leaveTypeName ?? "")
  ).length;
  const tripCount = todayAbsent.filter((r) =>
    /출장|trip|travel/i.test(r.leaveTypeName ?? "")
  ).length;
  const leaveCount = todayAbsent.length - wfhCount - tripCount;
  const workingCount = Math.max(0, activeCount - todayAbsent.length);

  // 이번 달 휴가 범위 (캘린더용)
  const leaveRanges = monthCalendar.map((r) => ({ startDate: r.startDate, endDate: r.endDate }));

  // 이벤트 날짜 (생일/기념일 dot용)
  const eventDates = events.map((e) => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  return (
    <aside className="rail-h">
      {/* 오늘의 팀 현황 */}
      <div className="widget">
        <h5>
          오늘의 팀 현황
          <Link href="/members" className="all">전체 →</Link>
        </h5>
        <div className="today-grid">
          <div className="cell">
            <div className="n num">{String(workingCount).padStart(2, "0")}</div>
            <div className="l">출근</div>
          </div>
          <div className="cell">
            <div className="n num">{String(wfhCount).padStart(2, "0")}</div>
            <div className="l">재택</div>
          </div>
          <div className="cell">
            <div className="n num">{String(leaveCount).padStart(2, "0")}</div>
            <div className="l">휴가</div>
          </div>
          <div className="cell">
            <div className="n num">{String(tripCount).padStart(2, "0")}</div>
            <div className="l">출장</div>
          </div>
        </div>
      </div>

      {/* 이번 달 일정 */}
      <div className="widget">
        <h5>이번 달 일정 <Link href="/leave/calendar" className="all">월 보기 →</Link></h5>
        <MiniCalendar
          holidays={holidays}
          leaveRanges={leaveRanges}
          eventDates={eventDates}
        />
      </div>

      {/* 오늘 자리비움 */}
      {todayAbsent.length > 0 && (
        <div className="widget">
          <h5>
            오늘 자리 비움
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
          <h5>축하 보낼 동료</h5>
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
