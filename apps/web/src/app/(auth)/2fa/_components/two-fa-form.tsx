"use client";

import { useActionState } from "react";
import { verify2faAction } from "@/lib/actions/auth";

const initial = { error: null };

export function TwoFaForm() {
  const [state, formAction, isPending] = useActionState(verify2faAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="code" className="text-sm text-foreground-muted">
          인증 코드
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          required
          autoFocus
          className="rounded-md border border-border bg-background-primary px-3 py-2 text-center text-2xl font-mono tracking-[0.5em] text-foreground placeholder:text-foreground-subtle focus-visible:outline-none focus-visible:border-border-focus"
        />
        <p className="text-xs text-foreground-subtle">
          Google Authenticator 등 인증 앱의 6자리 코드를 입력하세요.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive-50 px-3 py-2 text-sm text-destructive-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? "확인 중…" : "확인"}
      </button>
    </form>
  );
}
