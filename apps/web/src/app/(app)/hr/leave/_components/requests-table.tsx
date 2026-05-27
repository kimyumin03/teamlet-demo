"use client";

import { useState } from "react";
import type { CompanyLeaveRequestItem } from "@teamlet/modules/leave";

const STATUS_LABEL: Record<CompanyLeaveRequestItem["status"], string> = {
  DRAFT: "임시저장",
  PENDING: "대기 중",
  APPROVED: "승인",
  REJECTED: "반려",
  CANCELLED: "취소",
};
const STATUS_CLASS: Record<CompanyLeaveRequestItem["status"], string> = {
  DRAFT: "bg-background-secondary text-foreground-subtle",
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-background-secondary text-foreground-muted",
  REJECTED: "bg-destructive-50 text-destructive-700",
  CANCELLED: "bg-background-secondary text-foreground-subtle",
};

const FILTER_TABS = [
  { id: "ALL", label: "전체" },
  { id: "PENDING", label: "대기" },
  { id: "APPROVED", label: "승인" },
  { id: "REJECTED", label: "반려" },
  { id: "CANCELLED", label: "취소" },
] as const;

type FilterId = (typeof FILTER_TABS)[number]["id"];

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

export function RequestsTable({ requests }: { requests: CompanyLeaveRequestItem[] }) {
  const [filter, setFilter] = useState<FilterId>("ALL");

  const filtered = filter === "ALL" ? requests : requests.filter((r) => r.status === filter);
  const countFor = (id: FilterId) =>
    id === "ALL" ? requests.length : requests.filter((r) => r.status === id).length;

  return (
    <div>
      {/* 필터 탭 */}
      <div className="mb-4 flex gap-1 border-b border-border">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex items-center gap-1.5 border-b-2 -mb-px px-3 py-2 text-sm transition-colors ${
              filter === tab.id
                ? "border-foreground text-foreground font-medium"
                : "border-transparent text-foreground-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs tabular-nums ${filter === tab.id ? "bg-foreground text-background-primary" : "bg-background-secondary text-foreground-subtle"}`}>
              {countFor(tab.id)}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-foreground-subtle">해당하는 신청이 없어요</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background-secondary">
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted">이름</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted">부서</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted">휴가 종류</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted">기간</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-foreground-muted">일수</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted">사유</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-background-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{r.employeeName}</td>
                  <td className="px-4 py-3 text-foreground-muted whitespace-nowrap">{r.departmentName ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground-muted whitespace-nowrap">{r.leaveTypeName}</td>
                  <td className="px-4 py-3 text-foreground-muted whitespace-nowrap tabular-nums">
                    {fmtDate(r.startDate)}
                    {r.startDate.toString() !== r.endDate.toString() && ` – ${fmtDate(r.endDate)}`}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{r.days}일</td>
                  <td className="px-4 py-3 text-foreground-muted max-w-[200px] truncate">{r.reason || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
