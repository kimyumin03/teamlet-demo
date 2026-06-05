"use client";

import { useState, useEffect, useRef } from "react";
import { listCompanyHolidaysAction } from "@/lib/actions/company";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function MiniCalendar({
  holidays = [],
  leaveRanges = [],
  eventDates = [],
}: {
  holidays?: { date: Date | string; name?: string }[];
  leaveRanges?: { startDate: Date | string; endDate: Date | string }[];
  eventDates?: (Date | string)[];
}) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const daysInPrev = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1);

  // 연도 이동 시 해당 연도 공휴일 fetch (홈은 props 로 현재 연도만 받음)
  const [fetchedMap, setFetchedMap] = useState<Map<string, string>>(new Map());
  const fetchedYears = useRef(new Set<number>([now.getFullYear()]));
  useEffect(() => {
    if (fetchedYears.current.has(viewYear)) return;
    fetchedYears.current.add(viewYear);
    listCompanyHolidaysAction(viewYear).then((res) => {
      if (!res.ok) return;
      setFetchedMap((prev) => {
        const m = new Map(prev);
        for (const h of res.data) { const d = new Date(h.date); m.set(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, h.name); }
        return m;
      });
    });
  }, [viewYear]);

  // 빠른 조회용 Map (날짜 → 공휴일명) — props(현재 연도) + fetch(다른 연도) 병합
  const holidayMap = new Map<string, string>(fetchedMap);
  for (const h of holidays) { const d = new Date(h.date); holidayMap.set(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, h.name ?? "공휴일"); }
  const eventSet = new Set(
    eventDates.map((d) => { const dt = new Date(d); return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`; })
  );

  // 휴가 범위 Set
  const rangeSet = new Set<string>();
  for (const r of leaveRanges) {
    const s = new Date(r.startDate); s.setHours(0, 0, 0, 0);
    const e = new Date(r.endDate); e.setHours(23, 59, 59, 999);
    let cur = new Date(s);
    while (cur <= e) {
      rangeSet.add(`${cur.getFullYear()}-${cur.getMonth()}-${cur.getDate()}`);
      cur.setDate(cur.getDate() + 1);
    }
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // 42칸 (6주) 채우기
  const cells: { day: number; outOfMonth: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, outOfMonth: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, outOfMonth: false });
  }
  const remain = 42 - cells.length;
  for (let d = 1; d <= remain; d++) {
    cells.push({ day: d, outOfMonth: true });
  }

  const weeks: typeof cells[] = [];
  for (let i = 0; i < 42; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div>
      {/* 헤더 */}
      <div className="cal-head">
        <span className="month">{viewYear}년 {viewMonth + 1}월</span>
        <div className="nav-btns">
          <button onClick={prevMonth}>‹</button>
          <button onClick={nextMonth}>›</button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="cal">
        {DAY_NAMES.map((d, i) => (
          <div key={d} className={`dow${i === 0 || i === 6 ? " sun" : ""}`}>{d}</div>
        ))}

        {/* 날짜 셀 */}
        {weeks.map((week, wi) =>
          week.map((cell, di) => {
            const isToday = !cell.outOfMonth && viewYear === todayY && viewMonth === todayM && cell.day === todayD;
            const key = `${viewYear}-${cell.outOfMonth ? (di < firstDay ? (viewMonth === 0 ? 11 : viewMonth - 1) : (viewMonth === 11 ? 0 : viewMonth + 1)) : viewMonth}-${cell.day}`;
            const curKey = `${viewYear}-${viewMonth}-${cell.day}`;
            const holidayName = !cell.outOfMonth ? holidayMap.get(curKey) : undefined;
            const isHoliday = holidayName != null;
            const isRange = !cell.outOfMonth && rangeSet.has(curKey);
            const hasEvent = !cell.outOfMonth && eventSet.has(curKey);
            const isWeekend = di === 0 || di === 6;

            let cls = "d";
            if (cell.outOfMonth) cls += " out";
            else if (isToday) cls += " today";
            else if (isWeekend || isHoliday) cls += " sun";
            if (isHoliday) cls += " holiday";
            if (isRange && !isToday) cls += " range";
            if (hasEvent || isHoliday) cls += " dot";

            return (
              <div key={`${wi}-${di}`} className={cls} title={holidayName}>
                {cell.day}
              </div>
            );
          })
        )}
      </div>

      {/* 범례 */}
      <div className="legend">
        <span className="l"><i />오늘</span>
        <span className="h"><i />공휴일</span>
        <span className="r"><i />휴가</span>
      </div>
    </div>
  );
}
