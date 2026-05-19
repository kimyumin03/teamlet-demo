"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Input } from "@teamlet/ui";
import { signupAction, type ActionState } from "@/lib/actions/auth";

const initial: ActionState = { error: null };

const fields = [
  { id: "name", label: "이름", type: "text", autoComplete: "name" },
  { id: "email", label: "이메일", type: "email", autoComplete: "email" },
  { id: "phone", label: "휴대폰", type: "tel", autoComplete: "tel" },
] as const;

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signupAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
    </form>
  );
}
