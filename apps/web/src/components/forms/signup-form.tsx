"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Input } from "@teamlet/ui";
import { signupAction, googleLoginAction, type ActionState } from "@/lib/actions/auth";

const initial: ActionState = { error: null };

const fields = [
  { id: "name", label: "이름", type: "text", autoComplete: "name" },
  { id: "email", label: "이메일", type: "email", autoComplete: "email" },
  { id: "phone", label: "휴대폰", type: "tel", autoComplete: "tel" },
] as const;

export function SignupForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction, isPending] = useActionState(signupAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
      {fields.map((f) => (
        <div key={f.id} className="flex flex-col gap-1.5">
          <label htmlFor={f.id} className="text-sm text-foreground-muted">
            {f.label}
          </label>
          <Input
            id={f.id}
            name={f.id}
            type={f.type}
            autoComplete={f.autoComplete}
            required
          />
        </div>
      ))}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm text-foreground-muted">
          비밀번호
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <p className="text-xs text-foreground-subtle">
          8자 이상, 영문·숫자·특수문자 포함
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="passwordConfirm"
          className="text-sm text-foreground-muted"
        >
          비밀번호 확인
        </label>
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
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
        {isPending ? "가입 중…" : "회원가입"}
      </Button>

      <p className="text-center text-sm text-foreground-muted">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-accent hover:underline">
          로그인
        </Link>
      </p>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-foreground-subtle">또는</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={googleLoginAction}>
        <Button type="submit" variant="secondary" className="w-full gap-2">
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google로 계속하기
        </Button>
      </form>
    </form>
  );
}
