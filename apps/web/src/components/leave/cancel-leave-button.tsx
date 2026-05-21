"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@teamlet/ui";
import { cancelLeaveAction } from "@/lib/actions/leave";

export function CancelLeaveButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    startTransition(async () => {
      const res = await cancelLeaveAction(requestId);
      if (res.ok) router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={isPending}
      onClick={handleCancel}
    >
      {isPending ? "취소 중…" : "취소"}
    </Button>
  );
}
