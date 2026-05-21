"use client";

import { useActionState } from "react";
import { Button, Input } from "@teamlet/ui";
import { updateProfileAction, type ProfileActionState } from "@/lib/actions/profile";

const initial: ProfileActionState = { error: null };

export function ProfileForm({ name, phone }: { name: string; phone?: string | null }) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm text-foreground-muted">이름</label>
        <Input id="name" name="name" defaultValue={name} required minLength={2} maxLength={50} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm text-foreground-muted">휴대폰 번호</label>
        <Input id="phone" name="phone" type="tel" defaultValue={phone ?? ""} placeholder="01012345678" />
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive-50 px-3 py-2 text-sm text-destructive-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">저장됐어요.</p>
      )}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "저장 중…" : "저장"}
      </Button>
    </form>
  );
}
