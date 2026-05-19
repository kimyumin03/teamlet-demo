"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Input } from "@teamlet/ui";
import {
  companyApplicationAction,
  type ActionState,
} from "@/lib/actions/tenancy";

const initial: ActionState = { error: null };

const SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;

export function RegisterCompanyForm() {
  const [state, formAction, isPending] = useActionState(
    companyApplicationAction,
    initial,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="companyName" className="text-sm text-foreground-muted">
          회사명
        </label>
        <Input id="companyName" name="companyName" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="businessNumber"
          className="text-sm text-foreground-muted"
        >
          사업자등록번호
        </label>
        <Input
          id="businessNumber"
          name="businessNumber"
          placeholder="000-00-00000"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="representativeName"
          className="text-sm text-foreground-muted"
        >
          대표자명
        </label>
        <Input id="representativeName" name="representativeName" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact" className="text-sm text-foreground-muted">
          연락처
        </label>
        <Input
          id="contact"
          name="contact"
          placeholder="02-0000-0000"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="companySize" className="text-sm text-foreground-muted">
          회사 규모
        </label>
        <select
          id="companySize"
          name="companySize"
          className="h-10 rounded-md border border-border bg-background-primary px-3 text-base text-foreground focus-visible:border-border-focus focus-visible:shadow-focus focus-visible:outline-none"
          defaultValue="1-10"
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s}명
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="industry" className="text-sm text-foreground-muted">
          업종
        </label>
        <Input id="industry" name="industry" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="memo" className="text-sm text-foreground-muted">
          신청 메모 (선택)
        </label>
        <Input id="memo" name="memo" />
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
        {isPending ? "신청 중…" : "회사 등록 신청"}
      </Button>
      <Link
        href="/join-company"
        className="text-center text-sm text-foreground-muted hover:text-foreground"
      >
        ← 가입 방법 다시 선택
      </Link>
    </form>
  );
}
