"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CompanyLeaveRequestItem } from "@teamlet/modules/leave";
import { approveLeaveAction, rejectLeaveAction } from "@/lib/actions/leave";

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
  APPROVED: "bg-green-50 text-green-700",
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

function ActionCell({ request }: { request: CompanyLeaveRequestItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // FormDocument 경유 신청 → 워크플로우 결재함에서 처리
  if (request.formDocumentId) {
    return (
      <Link
        href={`/workflow/documents/${request.formDocumentId}`}
        className="rounded-md px-2.5 py-1 text-xs font-medium border border-border text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors whitespace-nowrap"
      >
        결재함 →
      </Link>
    );
  }

  // 직접 승인/반려 (formDocument 없는 구형)
  if (request.status !== "PENDING") return null;

  function handleApprove() {
    startTransition(async () => {
      const res = await approveLeaveAction(request.id);
      if (!res.ok) alert(res.error.message);
      else router.refresh();
    });
  }

  function handleReject() {
    const note = prompt("반려 사유 (선택):");
    if (note === null) return;
    startTransition(async () => {
      const res = await rejectLeaveAction(request.id, note || undefined);
      if (!res.ok) alert(res.error.message);
      else router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", gap: 4 }}>
      <button onClick={handleApprove} disabled={isPending}
        style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
          background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
        승인
      </button>
      <button onClick={handleReject} disabled={isPending}
        style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
          background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
        반려
      </button>
    </div>
  );
}

export function RequestsTable({ requests }: { requests: CompanyLeaveRequestItem[] }) {
  const [filter, setFilter] = useState<FilterId>("PENDING");
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const filtered = filter === "ALL" ? requests : requests.filter((r) => r.status === filter);
  const countFor = (id: FilterId) =>
    id === "ALL" ? requests.length : requests.filter((r) => r.status === id).length;

  return (
    <div>
      {pendingCount > 0 && (
        <div style={{
          padding: "10px 14px", marginBottom: 14, borderRadius: 10,
          background: "#fffbeb", border: "1px solid #fde68a", fontSize: 13,
        }}>
          승인 대기 <strong>{pendingCount}건</strong> — 결재함 경유 신청은 "결재함 →" 버튼으로 이동해 처리해 주세요.
        </div>
      )}

      <div className="mb-4 flex gap-1 border-b border-border">
        {FILTER_TABS.map((tab) => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            className={`flex items-center gap-1.5 border-b-2 -mb-px px-3 py-2 text-sm transition-colors ${
              filter === tab.id ? "border-foreground text-foreground font-medium" : "border-transparent text-foreground-muted hover:text-foreground"
            }`}>
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs tabular-nums ${
              filter === tab.id ? "bg-foreground text-background-primary" : "bg-background-secondary text-foreground-subtle"
            }`}>{countFor(tab.id)}</span>
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
                <th className="px-4 py-3 text-right text-xs font-medium text-foreground-muted">처리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className={`hover:bg-background-secondary/50 transition-colors ${r.status === "PENDING" ? "bg-amber-50/30" : ""}`}>
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{r.employeeName}</td>
                  <td className="px-4 py-3 text-foreground-muted whitespace-nowrap">{r.departmentName ?? "—"}</td>
                  <td className="px-4 py-3 text-foreground-muted whitespace-nowrap">{r.leaveTypeName}</td>
                  <td className="px-4 py-3 text-foreground-muted whitespace-nowrap tabular-nums">
                    {fmtDate(r.startDate)}{r.startDate.toString() !== r.endDate.toString() && ` – ${fmtDate(r.endDate)}`}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{r.days}일</td>
                  <td className="px-4 py-3 text-foreground-muted max-w-[180px] truncate">{r.reason || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right"><ActionCell request={r} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
