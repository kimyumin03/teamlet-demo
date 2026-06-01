"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PendingMemberItem } from "@teamlet/modules/tenancy";
import { approveMembershipAction, rejectMembershipAction } from "@/lib/actions/join-requests";

export function JoinRequestsPanel({ items }: { items: PendingMemberItem[] }) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle(membershipId: string, action: "approve" | "reject") {
    startTransition(async () => {
      const res = action === "approve"
        ? await approveMembershipAction(membershipId)
        : await rejectMembershipAction(membershipId);
      if (res.error) { setError(res.error); return; }
      setList((prev) => prev.filter((i) => i.membershipId !== membershipId));
      router.refresh();
    });
  }

  if (list.length === 0) return null;

  return (
    <div className="breakdown" style={{ marginBottom: 16 }}>
      <h3>
        가입 신청 대기
        <span className="sub" style={{ marginLeft: 8 }}>
          {list.length}건 · 승인 또는 반려해 주세요
        </span>
      </h3>

      {error && (
        <p style={{ fontSize: 12.5, color: "var(--destructive)", marginBottom: 10 }}>{error}</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {list.map((item) => (
          <div
            key={item.membershipId}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px", border: "1px solid var(--border)",
              borderRadius: 10, background: "var(--bg-primary)",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--fg)" }}>{item.userName}</div>
              <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginTop: 2 }}>{item.userEmail}</div>
              <div style={{ fontSize: 11.5, color: "var(--fg-subtle)", marginTop: 1 }}>
                {new Date(item.requestedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })} 신청
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => handle(item.membershipId, "approve")}
                disabled={isPending}
                style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: "var(--primary)", color: "white", border: "none", cursor: "pointer",
                  opacity: isPending ? 0.6 : 1,
                }}
              >
                승인
              </button>
              <button
                onClick={() => handle(item.membershipId, "reject")}
                disabled={isPending}
                style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: "var(--bg-secondary)", color: "var(--fg-muted)",
                  border: "1px solid var(--border)", cursor: "pointer",
                  opacity: isPending ? 0.6 : 1,
                }}
              >
                반려
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
