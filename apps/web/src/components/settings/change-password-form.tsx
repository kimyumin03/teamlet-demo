"use client";

import { useActionState } from "react";
import { Button, Input } from "@teamlet/ui";
import { changePasswordAction, type ProfileActionState } from "@/lib/actions/profile";

const initial: ProfileActionState = { error: null };

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction, isPending] = useActionState(changePasswordAction, initial);

  if (!hasPassword) {
    return (
      <p className="text-sm text-foreground-muted">
        소셜 로그인 계정은 비밀번호를 변경할 수 없어요.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="currentPassword" className="text-sm text-foreground-muted">현재 비밀번호</label>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="newPassword" className="text-sm text-foreground-muted">새 비밀번호</label>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="newPasswordConfirm" className="text-sm text-foreground-muted">새 비밀번호 확인</label>
        <Input id="newPasswordConfirm" name="newPasswordConfirm" type="password" autoComplete="new-password" required />
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive-50 px-3 py-2 text-sm text-destructive-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">비밀번호가 변경됐어요.</p>
      )}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "변경 중…" : "비밀번호 변경"}
      </Button>
    </form>
  );
}
