"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Input } from "@teamlet/ui";
import { loginAction, type ActionState } from "@/lib/actions/auth";

const initial: ActionState = { error: null };

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, initial);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm text-foreground-muted">
            이메일
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
          />
        </div>

        {state.error && (
          <p
            role="alert"
            className="rounded-md bg-destructive-50 px-3 py-2 text-sm text-destructive-700"
          >
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "로그인 중…" : "로그인"}
        </Button>
      </form>

      <div className="text-center text-sm text-foreground-muted">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="hover:text-foreground">
          회원가입
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-foreground-subtle">또는</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button type="button" variant="secondary" className="w-full gap-2 cursor-not-allowed opacity-50" disabled title="Google OAuth 설정 후 사용 가능합니다">
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google로 계속하기
      </Button>
    </div>
  );
}
