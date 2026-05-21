"use client";

import { useTransition } from "react";
import { acceptInviteAction } from "@/lib/actions/invite";

export function AcceptInviteButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptInviteAction(token);
      if (result && "error" in result) {
        alert(result.error);
      }
    });
  }

  return (
    <button
      onClick={handleAccept}
      disabled={isPending}
      className="flex h-10 w-full items-center justify-center rounded-md bg-foreground text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
    >
      {isPending ? "처리 중…" : "초대 수락하기"}
    </button>
  );
}
