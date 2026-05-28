import Link from "next/link";
import type { LeaveBalanceSummary, CalendarLeaveItem } from "@teamlet/modules/leave";
import { MiniCalendar } from "./mini-calendar";

export function HomeRail({
  balances,
  annualBalance,
  todayAbsent = [],
}: {
  balances: LeaveBalanceSummary[];
  annualBalance: LeaveBalanceSummary | undefined;
  todayAbsent?: CalendarLeaveItem[];
}) {
  const otherBalances = balances.filter((b) => b.leaveTypeKey !== "annual" && b.remainingDays > 0);

  return (
    <aside className="rail-h">
      {/* 연차 잔여 */}
      {annualBalance && (
        <div className="widget">
          <h5>
            연차 잔여
            <Link href="/leave" className="all">신청 →</Link>
          </h5>
          <div className="today-grid">
            <div className="cell">
              <div className="n num">{annualBalance.remainingDays}</div>
              <div className="l">잔여</div>
            </div>
            <div className="cell">
              <div className="n num">{annualBalance.usedDays}</div>
              <div className="l">사용</div>
            </div>
          </div>
          <div style={{
            marginTop: "10px", height: "5px", background: "var(--bg-tertiary)",
            borderRadius: "3px", overflow: "hidden",
          }}>
            <div style={{
              height: "100%", background: "var(--primary)", borderRadius: "3px",
              width: `${Math.min(100, (annualBalance.usedDays / (annualBalance.grantedDays || 1)) * 100)}%`,
            }} />
          </div>
          <div style={{ marginTop: "6px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--fg-subtle)" }}>
            총 {annualBalance.grantedDays}일 부여
          </div>
        </div>
      )}

      {/* 미니 캘린더 */}
      <div className="widget">
        <h5>이번 달 일정 <span className="all">월 보기 →</span></h5>
        <MiniCalendar />
      </div>

      {/* 오늘 자리비움 */}
      {todayAbsent.length > 0 && (
        <div className="widget">
          <h5>오늘 자리 비움 <span className="all">{todayAbsent.length}명</span></h5>
          <div className="ooo">
            {todayAbsent.slice(0, 6).map((r) => (
              <div key={r.id} className="row">
                <div className="av sm">{r.employeeName.slice(-2)}</div>
                <span style={{ flex: 1, fontWeight: 600, fontSize: "13px" }}>{r.employeeName}</span>
                <span className="tag lv">{r.leaveTypeName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 기타 휴가 잔여 */}
      {otherBalances.length > 0 && (
        <div className="widget">
          <h5>기타 휴가</h5>
          <div className="b-list">
            {otherBalances.slice(0, 5).map((b) => (
              <div key={b.leaveTypeId} className="b">
                <div className="info">
                  <div className="nm">{b.leaveTypeName}</div>
                </div>
                <span className="when">{b.remainingDays}일</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
