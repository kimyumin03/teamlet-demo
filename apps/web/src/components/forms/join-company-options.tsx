"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Building2, KeyRound, Mail } from "lucide-react";
import { Button, Input } from "@teamlet/ui";
import { joinByCodeAction, type ActionState } from "@/lib/actions/tenancy";

const initial: ActionState = { error: null };

export function JoinCompanyOptions({ logoutAction }: { logoutAction: () => Promise<void> }) {
  const [mode, setMode] = useState<"menu" | "code">("menu");
  const [state, formAction, isPending] = useActionState(
    joinByCodeAction,
    initial,
  );

  if (mode === "code") {
    return (
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="companyCode"
            className="text-sm text-foreground-muted"
          >
            회사코드
          </label>
          <Input
            id="companyCode"
            name="companyCode"
            placeholder="XXXX-XXXX"
            autoComplete="off"
            required
          />
          <p className="text-xs text-foreground-subtle">
            관리자에게 받은 8자리 회사코드를 입력하세요.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="memo" className="text-sm text-foreground-muted">
            메모 (선택)
          </label>
          <Input id="memo" name="memo" placeholder="가입 요청 메모" />
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
          {isPending ? "신청 중…" : "가입 신청"}
        </Button>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMode("menu")}
            className="text-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            ← 다른 방법 선택
          </button>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-foreground-subtle hover:text-foreground transition-colors">
              뒤로가기
            </button>
          </form>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-foreground-muted">
        어떤 회사에 가입하시겠어요?
      </p>
      <form action={logoutAction}>
        <button type="submit" className="self-start text-sm text-foreground-subtle hover:text-foreground transition-colors">
          ← 뒤로가기
        </button>
      </form>

      <Link
        href="/register-company"
        className="flex items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-background-secondary"
      >
        <Building2 className="mt-0.5 size-5 shrink-0 text-foreground-muted" />
        <span>
          <span className="block text-md font-medium text-foreground">
            회사 등록 신청
          </span>
          <span className="block text-sm text-foreground-muted">
            새 회사를 Teamlet에 등록해요 (관리자 검토 후 승인).
          </span>
        </span>
      </Link>

      <button
        type="button"
        onClick={() => setMode("code")}
        className="flex items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-background-secondary"
      >
        <KeyRound className="mt-0.5 size-5 shrink-0 text-foreground-muted" />
        <span>
          <span className="block text-md font-medium text-foreground">
            회사코드로 가입
          </span>
          <span className="block text-sm text-foreground-muted">
            관리자에게 받은 회사코드로 가입을 신청해요.
          </span>
        </span>
      </button>

      <div className="flex items-start gap-3 rounded-lg border border-border bg-background-muted p-4 text-left">
        <Mail className="mt-0.5 size-5 shrink-0 text-foreground-subtle" />
        <span>
          <span className="block text-md font-medium text-foreground">
            초대 메일을 받았어요
          </span>
          <span className="block text-sm text-foreground-muted">
            메일의 초대 링크를 클릭하면 자동으로 연결돼요.
          </span>
        </span>
      </div>
    </div>
  );
}
