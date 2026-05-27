"use client";

import { useState, useTransition } from "react";
import { type PendingMemberItem } from "@teamlet/modules/tenancy";
import { approveMembershipAction, rejectMembershipAction } from "@/lib/actions/join-requests";

export function JoinRequestsClient({ items }: { items: PendingMemberItem[] }) {
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
    });
  }

  if (list.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background-secondary px-6 py-10 text-center">
        <p className="text-sm text-foreground-muted">대기 중인 가입 신청이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-destructive-600">{error}</p>}
      {list.map((item) => (
        <div
          key={item.membershipId}
          className="flex items-center justify-between rounded-lg border border-border bg-background-primary px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-foreground">{item.userName}</p>
            <p className="text-xs text-foreground-muted">{item.userEmail}</p>
            <p className="mt-0.5 text-xs text-foreground-subtle">
              {new Date(item.requestedAt).toLocaleDateString("ko-KR")} 신청
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handle(item.membershipId, "approve")}
              disabled={isPending}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              승인
            </button>
            <button
              onClick={() => handle(item.membershipId, "reject")}
              disabled={isPending}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground-muted hover:bg-background-secondary disabled:opacity-50 transition-colors"
            >
              반려
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
