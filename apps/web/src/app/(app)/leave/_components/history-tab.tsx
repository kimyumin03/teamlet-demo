"use client";

import { useState } from "react";
import { CalendarOff } from "lucide-react";
import type { LeaveRequestItem } from "@teamlet/modules/leave";
import { CancelLeaveButton } from "@/components/leave/cancel-leave-button";

const STATUS_LABEL: Record<LeaveRequestItem["status"], string> = {
  DRAFT: "임시저장",
  PENDING: "대기 중",
  APPROVED: "승인",
  REJECTED: "반려",
  CANCELLED: "취소",
};
const STATUS_CLASS: Record<LeaveRequestItem["status"], string> = {
  DRAFT: "bg-background-secondary text-foreground-subtle",
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-background-secondary text-foreground-muted",
  REJECTED: "bg-destructive-50 text-destructive-700",
  CANCELLED: "bg-background-secondary text-foreground-subtle",
};

const FILTERS = [
  { id: "all", label: "전체" },
  { id: "PENDING", label: "대기 중" },
  { id: "APPROVED", label: "승인" },
  { id: "REJECTED", label: "반려" },
  { id: "CANCELLED", label: "취소" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function HistoryTab({ requests }: { requests: LeaveRequestItem[] }) {
  const [filter, setFilter] = useState<FilterId>("all");

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const counts: Record<string, number> = {};
  for (const r of requests) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
  }

  return (
    <div>
      {/* 필터 탭 */}
      <div className="flex gap-1 border-b border-border mb-5">
        {FILTERS.map((f) => {
          const count = f.id === "all" ? requests.length : (counts[f.id] ?? 0);
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
                filter === f.id
                  ? "border-foreground text-foreground font-medium"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              }`}
            >
              {f.label}
              {count > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-background-secondary px-1 text-[10px] font-semibold text-foreground-subtle">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background-secondary">
            <CalendarOff className="h-5 w-5 text-foreground-subtle" />
          </div>
          <p className="text-sm text-foreground-muted">
            {filter === "all" ? "신청 내역이 없어요." : `${STATUS_LABEL[filter as LeaveRequestItem["status"]] ?? filter} 내역이 없어요.`}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background-primary px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-foreground">{r.leaveTypeName}</span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {r.days}일
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                  <span>{formatDate(r.startDate)}</span>
                  {r.startDate.toString() !== r.endDate.toString() && (
                    <>
                      <span className="text-foreground-subtle">–</span>
                      <span>{formatDate(r.endDate)}</span>
                    </>
                  )}
                  {r.reason && (
                    <span className="text-foreground-subtle truncate">· {r.reason}</span>
                  )}
                </div>
                {r.reviewNote && (
                  <p className="mt-1 text-xs text-foreground-subtle">
                    사유: {r.reviewNote}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
                {r.status === "PENDING" && <CancelLeaveButton requestId={r.id} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
