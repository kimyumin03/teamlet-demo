"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { JobPostingStatus } from "@teamlet/modules/recruit";
import { updatePostingStatusAction } from "@/lib/actions/recruit";

export function PostingStatusButton({
  postingId,
  currentStatus,
}: {
  postingId: string;
  currentStatus: JobPostingStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(status: "OPEN" | "CLOSED" | "CANCELLED") {
    startTransition(async () => {
      await updatePostingStatusAction(postingId, status);
      router.refresh();
    });
  }

  const selectClass = "h-10 rounded-md border border-border bg-background-primary px-3 text-sm text-foreground focus-visible:border-border-focus focus-visible:outline-none disabled:opacity-50";

  return (
    <select
      disabled={isPending}
      value={currentStatus}
      onChange={(e) => handleChange(e.target.value as "OPEN" | "CLOSED" | "CANCELLED")}
      className={selectClass}
    >
      <option value="OPEN">진행중</option>
      <option value="CLOSED">마감</option>
      <option value="CANCELLED">취소</option>
    </select>
  );
}
