import Link from "next/link";
import type { LeaveBalanceSummary, CalendarLeaveItem } from "@teamlet/modules/leave";
import type { HomeEventItem } from "@teamlet/modules/employee";
import { MiniCalendar } from "./mini-calendar";

export function HomeRail({
  annualBalance,
  todayAbsent = [],
  events = [],
  activeCount = 0,
}: {
  balances: LeaveBalanceSummary[];
  annualBalance: LeaveBalanceSummary | undefined;
  todayAbsent?: CalendarLeaveItem[];
  events?: HomeEventItem[];
  activeCount?: number;
}) {
  const birthdays = events.filter((e) => e.eventType === "birthday");
  const anniversaries = events.filter((e) => e.eventType === "join_anniversary");
  const celebrateList = [...birthdays, ...anniversaries];

  const workingCount = Math.max(0, activeCount - todayAbsent.length);

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
            <div className="n num">{activeCount}</div>
            <div className="l">전체 재직</div>
          </div>
          <div className="cell">
            <div className="n num">{workingCount}</div>
            <div className="l">출근</div>
          </div>
          <div className="cell">
            <div className="n num">{todayAbsent.length}</div>
            <div className="l">휴가</div>
          </div>
          {annualBalance && (
            <div className="cell">
              <div className="n num">{annualBalance.remainingDays}</div>
              <div className="l">내 연차</div>
            </div>
          )}
        </div>
      </div>

      {/* 이번 달 일정 */}
      <div className="widget">
        <h5>이번 달 일정 <span className="all">월 보기 →</span></h5>
        <MiniCalendar />
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
          <div className="ooo">
            {birthdays.map((e) => (
              <div key={e.employeeId} className="row">
                <span style={{ fontSize: "16px" }}>🎂</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: "13px" }}>{e.name}</span>
                <span className="tag" style={{ fontSize: "11px", color: "var(--fg-muted)" }}>생일</span>
              </div>
            ))}
            {anniversaries.map((e) => (
              <div key={e.employeeId} className="row">
                <span style={{ fontSize: "16px" }}>🥂</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: "13px" }}>{e.name}</span>
                <span className="tag" style={{ fontSize: "11px", color: "var(--fg-muted)" }}>입사 {e.years}주년</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
