import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listTeamLeaveCalendar, type CalendarLeaveItem } from "@teamlet/modules/leave";

export const dynamic = "force-dynamic";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

const LEAVE_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-purple-100 text-purple-800",
  "bg-pink-100 text-pink-800",
  "bg-teal-100 text-teal-800",
];

function buildMonthNav(year: number, month: number, delta: number) {
  let m = month + delta;
  let y = year;
  if (m < 1) { m = 12; y -= 1; }
  if (m > 12) { m = 1; y += 1; }
  return `/leave/calendar?year=${y}&month=${m}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDowOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

function isDateInRange(date: Date, start: Date, end: Date) {
  const d = date.getTime();
  return d >= start.getTime() && d <= end.getTime();
}

export default async function LeaveCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year ?? String(now.getFullYear()), 10);
  const month = parseInt(params.month ?? String(now.getMonth() + 1), 10);

  const result = await listTeamLeaveCalendar(session.user.employeeId, year, month);
  const items: CalendarLeaveItem[] = result.ok ? result.data : [];

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDowOfMonth(year, month);

  const employeeColorMap = new Map<string, string>();
  let colorIdx = 0;
  for (const item of items) {
    if (!employeeColorMap.has(item.employeeId)) {
      employeeColorMap.set(item.employeeId, LEAVE_COLORS[colorIdx % LEAVE_COLORS.length]!);
      colorIdx++;
    }
  }

  const dayMap = new Map<number, CalendarLeaveItem[]>();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dayItems = items.filter((item) =>
      isDateInRange(date, item.startDate, item.endDate),
    );
    if (dayItems.length > 0) dayMap.set(d, dayItems);
  }

  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;

  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="shrink-0 border-b border-border bg-background-primary px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight">팀 휴가 캘린더</h1>
            <p className="mt-0.5 text-[13px] text-foreground-muted">승인된 휴가를 월별로 확인해요</p>
          </div>
          <Link
            href="/leave"
            className="shrink-0 text-[12px] text-foreground-subtle hover:text-foreground transition-colors"
          >
            내 휴가 →
          </Link>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="mx-auto max-w-5xl flex flex-col gap-4">

          {/* 월 이동 */}
          <div className="flex items-center justify-between">
            <Link
              href={buildMonthNav(year, month, -1)}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-border hover:bg-background-secondary transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
                <path fillRule="evenodd" d="M9.78 3.47a.75.75 0 0 1 0 1.06L6.81 7.5l2.97 2.97a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
            </Link>
            <span className="text-[15px] font-semibold text-foreground">
              {year}년 {month}월
            </span>
            <Link
              href={buildMonthNav(year, month, 1)}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-border hover:bg-background-secondary transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="size-4">
                <path fillRule="evenodd" d="M6.22 3.47a.75.75 0 0 1 1.06 0l3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 1 1-1.06-1.06L9.19 7.5 6.22 4.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          {/* 캘린더 그리드 */}
          <div className="overflow-hidden rounded-[14px] border border-border">
            <div className="grid grid-cols-7 border-b border-border bg-background-secondary">
              {DOW.map((d) => (
                <div key={d} className="py-2 text-center text-[11px] font-medium text-foreground-muted">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                const isToday = isCurrentMonth && day === now.getDate();
                const dayItems = day ? (dayMap.get(day) ?? []) : [];
                const isWeekend = idx % 7 === 0 || idx % 7 === 6;

                return (
                  <div
                    key={idx}
                    className={`min-h-[90px] border-b border-r border-border p-1.5 ${
                      !day ? "bg-background-secondary/40" : ""
                    } ${isWeekend && day ? "bg-background-secondary/20" : ""}`}
                  >
                    {day && (
                      <>
                        <span
                          className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium ${
                            isToday
                              ? "bg-foreground text-background"
                              : "text-foreground-muted"
                          }`}
                        >
                          {day}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          {dayItems.slice(0, 3).map((item) => (
                            <span
                              key={item.id + day}
                              className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${employeeColorMap.get(item.employeeId)}`}
                              title={`${item.employeeName} — ${item.leaveTypeName}`}
                            >
                              {item.employeeName}
                            </span>
                          ))}
                          {dayItems.length > 3 && (
                            <span className="px-1 text-[10px] text-foreground-subtle">
                              +{dayItems.length - 3}명
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 범례 */}
          {items.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Array.from(employeeColorMap.entries()).map(([empId, color]) => {
                const item = items.find((i) => i.employeeId === empId);
                if (!item) return null;
                return (
                  <span key={empId} className={`rounded-[5px] px-2 py-0.5 text-[11px] font-medium ${color}`}>
                    {item.employeeName}
                    {item.departmentName && (
                      <span className="ml-1 opacity-70">· {item.departmentName}</span>
                    )}
                  </span>
                );
              })}
            </div>
          )}

          {items.length === 0 && (
            <p className="text-center text-[13px] text-foreground-muted">
              이 달에 승인된 휴가가 없어요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
