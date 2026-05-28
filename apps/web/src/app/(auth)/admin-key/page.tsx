"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button, Input } from "@teamlet/ui";
import { AuthLogo } from "@/components/auth/auth-logo";
import { adminKeyLoginAction, type ActionState } from "@/lib/actions/auth";

const initial: ActionState = { error: null };

function AdminKeyForm() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [state, formAction, isPending] = useActionState(adminKeyLoginAction, initial);

  return (
    <div className="flex flex-col gap-6">
      <AuthLogo />

      <div>
        <h2 className="text-[22px] font-bold leading-tight tracking-tight">관리자 인증</h2>
        <p className="mt-1.5 text-[13.5px] text-foreground-muted">
          플랫폼 관리자 접근을 위한 비밀키를 입력하세요.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={email} />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-foreground-muted">이메일</label>
          <p className="rounded-md border border-border bg-background-secondary px-3 py-2 text-sm text-foreground-muted">
            {email}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="adminKey" className="text-xs font-medium text-foreground-muted">
            관리자 비밀키
          </label>
          <Input
            id="adminKey"
            name="adminKey"
            type="password"
            autoComplete="off"
            autoFocus
            required
          />
        </div>

        {state.error && (
          <p role="alert" className="rounded-md bg-destructive-50 px-3 py-2 text-sm text-destructive-700">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "인증 중…" : "관리자 콘솔 접속 →"}
        </Button>
      </form>

      <a href="/login" className="text-center text-[12.5px] text-foreground-muted hover:text-foreground transition-colors">
        ← 일반 로그인으로 돌아가기
      </a>
    </div>
  );
}

export default function AdminKeyPage() {
  return (
    <Suspense>
      <AdminKeyForm />
    </Suspense>
  );
}
