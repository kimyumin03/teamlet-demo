import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { auth } from "@/auth";
import { listTeamLeaveCalendar, type CalendarLeaveItem } from "@teamlet/modules/leave";

export const dynamic = "force-dynamic";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

const LEAVE_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
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
  return new Date(year, month - 1, 1).getDay(); // 0=Sun
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

  // 직원별 색상 인덱스 고정
  const employeeColorMap = new Map<string, string>();
  let colorIdx = 0;
  for (const item of items) {
    if (!employeeColorMap.has(item.employeeId)) {
      employeeColorMap.set(item.employeeId, LEAVE_COLORS[colorIdx % LEAVE_COLORS.length]!);
      colorIdx++;
    }
  }

  // day → items 맵
  const dayMap = new Map<number, CalendarLeaveItem[]>();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dayItems = items.filter((item) =>
      isDateInRange(date, item.startDate, item.endDate),
    );
    if (dayItems.length > 0) dayMap.set(d, dayItems);
  }

  const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;

  // 캘린더 셀 배열 (앞 빈칸 + 날짜들)
  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // 6줄로 맞추기
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* 헤더 */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">팀 휴가 캘린더</h1>
          <p className="mt-0.5 text-sm text-foreground-muted">승인된 휴가를 월별로 확인해요</p>
        </div>
        <Link href="/leave" className="text-sm text-foreground-muted hover:text-foreground">
          내 휴가 →
        </Link>
      </header>

      {/* 월 이동 */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={buildMonthNav(year, month, -1)}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-background-secondary transition-colors"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <span className="text-base font-semibold text-foreground">
          {year}년 {month}월
        </span>
        <Link
          href={buildMonthNav(year, month, 1)}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-background-secondary transition-colors"
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {/* 캘린더 그리드 */}
      <div className="overflow-hidden rounded-xl border border-border">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-border">
          {DOW.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-medium text-foreground-muted"
            >
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            const isToday =
              isCurrentMonth && day === now.getDate();
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
                      className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
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
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from(employeeColorMap.entries()).map(([empId, color]) => {
            const item = items.find((i) => i.employeeId === empId);
            if (!item) return null;
            return (
              <span
                key={empId}
                className={`rounded-md px-2 py-0.5 text-xs ${color}`}
              >
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
        <p className="mt-6 text-center text-sm text-foreground-muted">
          이 달에 승인된 휴가가 없어요.
        </p>
      )}
    </div>
  );
}
