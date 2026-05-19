"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Input } from "@teamlet/ui";
import { loginAction, type ActionState } from "@/lib/actions/auth";

const initial: ActionState = { error: null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm text-foreground-muted">
          비밀번호
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
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

      <div className="flex items-center justify-between text-sm text-foreground-muted">
        <Link href="/signup" className="hover:text-foreground">
          회원가입
        </Link>
        <span className="text-foreground-subtle">비밀번호 찾기</span>
      </div>
    </form>
  );
}
