"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@teamlet/ui";
import { signupAction, googleLoginAction } from "@/lib/actions/auth";

function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

type FieldErrors = Partial<Record<"name" | "email" | "phone", string>>;

const BASE = "h-10 w-full rounded-md border bg-background-primary px-3 text-sm text-foreground outline-none transition-colors focus:border-foreground-subtle disabled:opacity-60";
const BORDER_OK = "border-border";
const BORDER_ERR = "border-destructive-500";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-foreground-muted">{label}</label>
      {children}
      {error && <p className="text-[12px] text-destructive">{error}</p>}
    </div>
  );
}

export function SignupForm({ callbackUrl }: { callbackUrl?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function clearError(field: keyof FieldErrors) {
    setFieldErrors((p) => ({ ...p, [field]: undefined }));
  }

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (name.trim().length < 2) errs.name = "이름을 입력해 주세요";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "올바른 이메일 형식이 아니에요";
    const digits = phone.replace(/\D/g, "");
    if (!/^01[016789]\d{7,8}$/.test(digits)) errs.phone = "올바른 연락처를 입력해 주세요";
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setServerError(null);

    const data = new FormData();
    if (callbackUrl) data.set("callbackUrl", callbackUrl);
    data.set("name", name.trim());
    data.set("email", email.trim());
    data.set("phone", phone);

    startTransition(async () => {
      const res = await signupAction({ error: null }, data);
      if (res?.error) setServerError(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Field label="이름" error={fieldErrors.name}>
        <input
          className={`${BASE} ${fieldErrors.name ? BORDER_ERR : BORDER_OK}`}
          value={name}
          onChange={(e) => { setName(e.target.value); clearError("name"); }}
          disabled={isPending}
          autoComplete="name"
        />
      </Field>

      <Field label="이메일" error={fieldErrors.email}>
        <input
          className={`${BASE} ${fieldErrors.email ? BORDER_ERR : BORDER_OK}`}
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
          disabled={isPending}
          autoComplete="email"
        />
      </Field>

      <Field label="연락처" error={fieldErrors.phone}>
        <input
          className={`${BASE} ${fieldErrors.phone ? BORDER_ERR : BORDER_OK}`}
          value={phone}
          onChange={(e) => { setPhone(formatPhone(e.target.value)); clearError("phone"); }}
          disabled={isPending}
          placeholder="010-0000-0000"
          inputMode="tel"
          maxLength={13}
        />
      </Field>

      {serverError && (
        <p role="alert" className="rounded-[14px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">
          {serverError}
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
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84z"/>
          </svg>
          Google로 계속하기
        </Button>
      </form>
    </form>
  );
}
