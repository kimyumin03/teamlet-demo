"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
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
            className="text-[13px] text-foreground-muted"
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
            className="rounded-[14px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive"
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
        className="flex items-start gap-3 rounded-[14px] border border-border p-4 text-left transition-colors hover:bg-background-secondary"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="mt-0.5 size-5 shrink-0 text-foreground-muted">
          <path fillRule="evenodd" d="M1.5 2.5A1.5 1.5 0 0 1 3 1h6.586a1.5 1.5 0 0 1 1.06.44l3.915 3.914A1.5 1.5 0 0 1 15 6.414V13.5A1.5 1.5 0 0 1 13.5 15h-11A1.5 1.5 0 0 1 1 13.5v-11ZM3 2.5v11h10V6.5h-3A1.5 1.5 0 0 1 8.5 5V2.5H3Zm7 .621V5h1.879L10 3.121Z" clipRule="evenodd" />
        </svg>
        <span>
          <span className="block text-[13.5px] font-semibold text-foreground">
            회사 등록 신청
          </span>
          <span className="block text-[12.5px] text-foreground-muted">
            새 회사를 Teamlet에 등록해요 (관리자 검토 후 승인).
          </span>
        </span>
      </Link>

      <button
        type="button"
        onClick={() => setMode("code")}
        className="flex items-start gap-3 rounded-[14px] border border-border p-4 text-left transition-colors hover:bg-background-secondary"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="mt-0.5 size-5 shrink-0 text-foreground-muted">
          <path fillRule="evenodd" d="M8 1a4.5 4.5 0 0 0-4.5 4.5V9H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-.5V5.5A4.5 4.5 0 0 0 8 1ZM5 5.5a3 3 0 1 1 6 0V9H5V5.5ZM8 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" clipRule="evenodd" />
        </svg>
        <span>
          <span className="block text-[13.5px] font-semibold text-foreground">
            회사코드로 가입
          </span>
          <span className="block text-[12.5px] text-foreground-muted">
            관리자에게 받은 회사코드로 가입을 신청해요.
          </span>
        </span>
      </button>

      <div className="flex items-start gap-3 rounded-[14px] border border-border bg-background-secondary p-4 text-left">
        <svg viewBox="0 0 16 16" fill="currentColor" className="mt-0.5 size-5 shrink-0 text-foreground-subtle">
          <path d="M1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5C0 2.784.784 2 1.75 2ZM1.5 12.251c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V5.809L8.38 9.397a.75.75 0 0 1-.76 0L1.5 5.809v6.442Zm13-8.181v-.32a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25v.32L8 7.88l6.5-3.81Z" />
        </svg>
        <span>
          <span className="block text-[13.5px] font-semibold text-foreground">
            초대 메일을 받았어요
          </span>
          <span className="block text-[12.5px] text-foreground-muted">
            메일의 초대 링크를 클릭하면 자동으로 연결돼요.
          </span>
        </span>
      </div>
    </div>
  );
}
