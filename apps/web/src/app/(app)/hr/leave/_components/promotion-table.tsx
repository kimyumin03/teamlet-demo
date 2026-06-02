"use client";

import { useState, useTransition } from "react";
import type { LeavePromotionItem } from "@teamlet/modules/leave";
import { cancelLeavePromotionAction } from "@/lib/actions/leave-promotion";

const TYPE_LABEL: Record<string, string> = {
  ANNUAL: "연차",
  MONTHLY_1ST: "월차 1차",
  MONTHLY_2ND: "월차 2차",
};

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "작성요청됨",
  ADMIN_WRITING: "관리자작성기간",
  APPROVAL_PENDING: "승인진행중",
  REJECTED: "반려",
  COMPLETED: "완료",
  EXPIRED: "작성기간지남",
  CANCELLED: "촉진취소",
};

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: "#2563eb",
  ADMIN_WRITING: "#7c3aed",
  APPROVAL_PENDING: "#d97706",
  REJECTED: "var(--destructive)",
  COMPLETED: "#16a34a",
  EXPIRED: "var(--fg-muted)",
  CANCELLED: "var(--fg-subtle)",
};

function fmtDate(d: Date) {
  const dt = new Date(d);
  return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getDate()).padStart(2, "0")}`;
}

const ACTIVE_STATUSES = new Set(["REQUESTED", "ADMIN_WRITING", "APPROVAL_PENDING", "REJECTED"]);
const DONE_STATUSES = new Set(["COMPLETED", "EXPIRED", "CANCELLED"]);

export function PromotionTable({ promotions }: { promotions: LeavePromotionItem[] }) {
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [, startTransition] = useTransition();

  const filtered = promotions.filter((p) => {
    if (filter === "active") return ACTIVE_STATUSES.has(p.status);
    if (filter === "done") return DONE_STATUSES.has(p.status);
    return true;
  });

  function handleCancel(id: string) {
    if (!confirm("촉진을 취소할까요?")) return;
    startTransition(async () => {
      await cancelLeavePromotionAction(id);
    });
  }

  if (promotions.length === 0) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "14px", color: "var(--fg-muted)" }}>
        <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--fg)", marginBottom: "6px" }}>연차 촉진 내역이 없어요</div>
        <div style={{ fontSize: "12.5px" }}>연차 촉진 설정에서 스마트 촉진을 사용하면 자동으로 생성돼요</div>
      </div>
    );
  }

  return (
    <div>
      {/* 필터 탭 */}
      <div className="tabs" style={{ marginBottom: "16px" }}>
        {(["all", "active", "done"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`tab${filter === f ? " active" : ""}`}>
            {f === "all" ? "전체" : f === "active" ? "진행 중" : "종료"}
            <span style={{ marginLeft: "4px", fontSize: "11px", fontVariantNumeric: "tabular-nums",
              color: filter === f ? "var(--primary)" : "var(--fg-muted)" }}>
              {f === "all" ? promotions.length : f === "active"
                ? promotions.filter((p) => ACTIVE_STATUSES.has(p.status)).length
                : promotions.filter((p) => DONE_STATUSES.has(p.status)).length}
            </span>
          </button>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={TH}>재직상태</th>
              <th style={TH}>이름</th>
              <th style={TH}>사번</th>
              <th style={TH}>촉진 유형</th>
              <th style={TH}>소멸일</th>
              <th style={TH}>진행 상태</th>
              <th style={TH}>사용 계획</th>
              <th style={TH}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={TD}>
                  <span style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "99px", border: "1px solid var(--border)",
                    color: p.employmentStatus === "ACTIVE" ? "#16a34a" : "var(--fg-muted)" }}>
                    {p.employmentStatus === "ACTIVE" ? "재직" : p.employmentStatus === "ON_LEAVE" ? "휴직" : p.employmentStatus}
                  </span>
                </td>
                <td style={TD}>{p.employeeName}</td>
                <td style={{ ...TD, color: "var(--fg-muted)" }}>{p.employeeNumber ?? "—"}</td>
                <td style={TD}>
                  <span style={{ fontSize: "11.5px", padding: "2px 7px", borderRadius: "6px", border: "1px solid var(--border)",
                    background: "var(--bg-secondary)", fontWeight: 600 }}>
                    {TYPE_LABEL[p.promotionType] ?? p.promotionType}
                  </span>
                </td>
                <td style={{ ...TD, fontVariantNumeric: "tabular-nums" }}>{fmtDate(p.expiryDate)}</td>
                <td style={TD}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: STATUS_COLOR[p.status] ?? "var(--fg)" }}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </td>
                <td style={TD}>
                  {p.planDates.length > 0 ? (
                    <span style={{ fontSize: "12px", color: "var(--fg-muted)" }}>
                      {p.planDates.slice(0, 2).map(fmtDate).join(", ")}
                      {p.planDates.length > 2 && ` 외 ${p.planDates.length - 2}건`}
                    </span>
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--fg-subtle)" }}>미제출</span>
                  )}
                </td>
                <td style={TD}>
                  {!DONE_STATUSES.has(p.status) && (
                    <button onClick={() => handleCancel(p.id)}
                      style={{ fontSize: "12px", color: "var(--destructive)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>
                      취소
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const TH: React.CSSProperties = {
  padding: "8px 12px",
  fontWeight: 600,
  textAlign: "left",
  color: "var(--fg-muted)",
  whiteSpace: "nowrap",
  fontSize: "12px",
};

const TD: React.CSSProperties = {
  padding: "10px 12px",
  whiteSpace: "nowrap",
};
