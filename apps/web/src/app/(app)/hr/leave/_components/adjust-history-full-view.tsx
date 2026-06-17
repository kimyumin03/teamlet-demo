"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { listLeaveAdjustmentHistoryAction } from "@/lib/actions/leave";
import type { LeaveAdjustmentHistoryRow, LeaveAdjustmentKind, LeaveTypeItem } from "@teamlet/modules/leave";

function fmtDateTime(d: Date | string) {
  const dt = new Date(d);
  const h = dt.getHours();
  const m = String(dt.getMinutes()).padStart(2, "0");
  return `${dt.getFullYear()}. ${dt.getMonth() + 1}. ${dt.getDate()}. ${h >= 12 ? "오후" : "오전"} ${h % 12 || 12}:${m}`;
}

type GroupFilter = "all" | "annual" | "settlement";

const KIND_LABEL: Record<LeaveAdjustmentKind, string> = {
  annual: "연차 조정",
  incumbent: "재직자 정산",
  resigned: "퇴직자 정산",
  other: "조정",
};

const GROUP_TITLE: Record<GroupFilter, string> = {
  all: "연차 조정 내역",
  annual: "연차 조정 내역",
  settlement: "재직·퇴직자 잔여 조정 내역",
};

export function AdjustHistoryFullView({
  initialRows,
  leaveTypes,
  currentYear,
  initialGroup = "all",
}: {
  initialRows: LeaveAdjustmentHistoryRow[];
  leaveTypes: LeaveTypeItem[];
  currentYear: number;
  initialGroup?: GroupFilter;
}) {
  const [rows, setRows] = useState<LeaveAdjustmentHistoryRow[]>(initialRows);
  const [filterYear, setFilterYear] = useState<number | "all">(currentYear);
  const [filterGroup, setFilterGroup] = useState<GroupFilter>(initialGroup);
  const [filterLeaveTypeId, setFilterLeaveTypeId] = useState("");
  const [isPending, startTransition] = useTransition();

  const years = [currentYear, currentYear - 1, currentYear - 2];

  function reload(year: number | "all", group: GroupFilter, ltId: string) {
    startTransition(async () => {
      const res = await listLeaveAdjustmentHistoryAction({
        ...(year === "all" ? {} : { year }),
        ...(group === "all" ? {} : { group }),
        ...(ltId ? { leaveTypeId: ltId } : {}),
      });
      if (res.ok) setRows(res.data);
    });
  }

  function changeYear(y: number | "all") {
    setFilterYear(y);
    reload(y, filterGroup, filterLeaveTypeId);
  }
  function changeGroup(g: GroupFilter) {
    setFilterGroup(g);
    reload(filterYear, g, filterLeaveTypeId);
  }
  function changeLeaveType(ltId: string) {
    setFilterLeaveTypeId(ltId);
    reload(filterYear, filterGroup, ltId);
  }

  const chipCls = (active: boolean) =>
    `rounded-full border px-3 py-1 text-[12px] font-semibold cursor-pointer transition-colors ${
      active
        ? "border-foreground bg-foreground text-background"
        : "border-border text-foreground-muted hover:bg-background-secondary"
    }`;

  const title = GROUP_TITLE[filterGroup];

  return (
    <div className="page-body">
      {/* 브레드크럼 */}
      <div style={{ fontSize: 12.5, color: "var(--fg-subtle)", marginBottom: 8 }}>
        <Link href="/hr/leave" style={{ color: "var(--fg-muted)", textDecoration: "none" }}>
          휴가 보유 현황
        </Link>
        <span style={{ margin: "0 6px" }}>›</span>
        <span style={{ color: "var(--fg)" }}>{title}</span>
      </div>

      {/* 헤더 */}
      <div className="page-h">
        <div>
          <h1 className="h-title">{title}</h1>
          <div className="h-sub">관리자가 수동으로 부여·차감한 조정 내역을 확인할 수 있어요.</div>
        </div>
      </div>

      {/* 필터 바 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        {/* 구분 */}
        <div style={{ display: "flex", gap: 4 }}>
          {(["all", "annual", "settlement"] as GroupFilter[]).map((g) => (
            <button key={g} type="button" onClick={() => changeGroup(g)} className={chipCls(filterGroup === g)}>
              {g === "all" ? "전체" : g === "annual" ? "연차 조정" : "재직·퇴직 정산"}
            </button>
          ))}
        </div>

        <span style={{ width: 1, height: 18, background: "var(--border)" }} />

        {/* 연도 */}
        <div style={{ display: "flex", gap: 4 }}>
          {years.map((y) => (
            <button key={y} type="button" onClick={() => changeYear(y)} className={chipCls(filterYear === y)}>
              {y}년
            </button>
          ))}
          <button type="button" onClick={() => changeYear("all")} className={chipCls(filterYear === "all")}>
            전체
          </button>
        </div>

        {/* 휴가 종류 */}
        <select
          value={filterLeaveTypeId}
          onChange={(e) => changeLeaveType(e.target.value)}
          style={{
            borderRadius: 999, border: "1px solid var(--border)", background: "var(--bg-primary)",
            padding: "4px 12px", fontSize: 12, color: "var(--fg-muted)", cursor: "pointer",
          }}
        >
          <option value="">휴가 종류 · 전체</option>
          {leaveTypes.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--fg-subtle)", fontVariantNumeric: "tabular-nums" }}>
          {isPending ? "불러오는 중…" : `총 ${rows.length}건`}
        </span>
      </div>

      {/* 테이블 */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background-secondary text-left">
              <th className="px-4 py-2.5 text-[11.5px] font-medium text-foreground-subtle">대상자</th>
              <th className="px-4 py-2.5 text-[11.5px] font-medium text-foreground-subtle">휴가 종류</th>
              <th className="px-4 py-2.5 text-[11.5px] font-medium text-foreground-subtle">구분</th>
              <th className="px-4 py-2.5 text-right text-[11.5px] font-medium text-foreground-subtle">일수</th>
              <th className="px-4 py-2.5 text-[11.5px] font-medium text-foreground-subtle">조정자 · 조정 일시</th>
              <th className="px-4 py-2.5 text-[11.5px] font-medium text-foreground-subtle">사유</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[13px] text-foreground-muted">
                  조정 내역이 없어요.
                </td>
              </tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="hover:bg-background-secondary/40 transition-colors">
                <td className="px-4 py-2.5">
                  <span className="font-medium text-foreground">{r.employeeName}</span>
                  {r.departmentName && (
                    <span className="ml-1.5 text-[11.5px] text-foreground-muted">· {r.departmentName}</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-foreground">{r.leaveTypeName}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${
                    r.kind === "incumbent" || r.kind === "resigned"
                      ? "border-primary/30 text-primary"
                      : "border-border text-foreground-muted"
                  }`}>
                    {KIND_LABEL[r.kind]}
                  </span>
                </td>
                <td className={`px-4 py-2.5 text-right font-mono font-semibold ${r.days < 0 ? "text-destructive-600" : "text-foreground"}`}>
                  {r.days > 0 ? "+" : ""}{r.days}일
                </td>
                <td className="px-4 py-2.5 text-[12px] text-foreground-muted">
                  {r.actorName ?? "—"} · {fmtDateTime(r.occurredAt)}
                </td>
                <td className="px-4 py-2.5 text-[12px] text-foreground-muted">
                  {r.reason || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
