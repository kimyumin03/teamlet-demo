"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { Button } from "@teamlet/ui";
import { companyApplicationAction } from "@/lib/actions/tenancy";

const SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;

function formatBusinessNumber(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

function formatContact(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.startsWith("02")) {
    // 서울 2자리 지역번호
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`;
  }
  // 010, 011, 016~019, 031, 032 ... 등 3자리 지역번호
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

type FieldErrors = Partial<Record<
  "companyName" | "businessNumber" | "representativeName" | "contact" | "industry",
  string
>>;

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-foreground-muted">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive-700">{error}</p>}
    </div>
  );
}

const BASE =
  "h-10 w-full rounded-md border bg-background-primary px-3 text-sm text-foreground outline-none transition-colors focus:border-foreground-subtle disabled:opacity-60";
const BORDER_OK = "border-border";
const BORDER_ERR = "border-destructive-500";

export function RegisterCompanyForm() {
  const [companyName, setCompanyName] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [contact, setContact] = useState("");
  const [companySize, setCompanySize] = useState("1-10");
  const [industry, setIndustry] = useState("");
  const [memo, setMemo] = useState("");
  const [docFileName, setDocFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!companyName.trim()) errs.companyName = "회사명을 입력해 주세요";
    const bnDigits = businessNumber.replace(/\D/g, "");
    if (bnDigits.length !== 10) errs.businessNumber = "사업자등록번호 10자리를 입력해 주세요";
    if (!representativeName.trim()) errs.representativeName = "대표자명을 입력해 주세요";
    const ctDigits = contact.replace(/\D/g, "");
    if (ctDigits.length < 9) errs.contact = "연락처를 올바르게 입력해 주세요";
    if (!industry.trim()) errs.industry = "업종을 입력해 주세요";
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setServerError(null);

    const data = new FormData();
    data.set("companyName", companyName.trim());
    data.set("businessNumber", businessNumber);
    data.set("representativeName", representativeName.trim());
    data.set("contact", contact);
    data.set("companySize", companySize);
    data.set("industry", industry.trim());
    data.set("memo", memo.trim());
    const docFile = fileRef.current?.files?.[0];
    if (docFile) data.set("document", docFile);

    startTransition(async () => {
      const res = await companyApplicationAction({ error: null }, data);
      if (res?.error) setServerError(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Field label="회사명" error={fieldErrors.companyName}>
        <input
          className={`${BASE} ${fieldErrors.companyName ? BORDER_ERR : BORDER_OK}`}
          value={companyName}
          onChange={(e) => { setCompanyName(e.target.value); setFieldErrors((p) => ({ ...p, companyName: undefined })); }}
          disabled={isPending}
          placeholder="(주)테크컴퍼니"
        />
      </Field>

      <Field label="사업자등록번호" error={fieldErrors.businessNumber}>
        <input
          className={`${BASE} ${fieldErrors.businessNumber ? BORDER_ERR : BORDER_OK}`}
          value={businessNumber}
          onChange={(e) => { setBusinessNumber(formatBusinessNumber(e.target.value)); setFieldErrors((p) => ({ ...p, businessNumber: undefined })); }}
          disabled={isPending}
          placeholder="000-00-00000"
          inputMode="numeric"
          maxLength={12}
        />
      </Field>

      <Field label="대표자명" error={fieldErrors.representativeName}>
        <input
          className={`${BASE} ${fieldErrors.representativeName ? BORDER_ERR : BORDER_OK}`}
          value={representativeName}
          onChange={(e) => { setRepresentativeName(e.target.value); setFieldErrors((p) => ({ ...p, representativeName: undefined })); }}
          disabled={isPending}
        />
      </Field>

      <Field label="연락처" error={fieldErrors.contact}>
        <input
          className={`${BASE} ${fieldErrors.contact ? BORDER_ERR : BORDER_OK}`}
          value={contact}
          onChange={(e) => { setContact(formatContact(e.target.value)); setFieldErrors((p) => ({ ...p, contact: undefined })); }}
          disabled={isPending}
          placeholder="010-0000-0000"
          inputMode="tel"
          maxLength={13}
        />
      </Field>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-foreground-muted">회사 규모</label>
        <select
          className="h-10 w-full rounded-md border border-border bg-background-primary px-3 text-sm text-foreground outline-none focus:border-foreground-subtle"
          value={companySize}
          onChange={(e) => setCompanySize(e.target.value)}
          disabled={isPending}
        >
          {SIZES.map((s) => <option key={s} value={s}>{s}명</option>)}
        </select>
      </div>

      <Field label="업종" error={fieldErrors.industry}>
        <input
          className={`${BASE} ${fieldErrors.industry ? BORDER_ERR : BORDER_OK}`}
          value={industry}
          onChange={(e) => { setIndustry(e.target.value); setFieldErrors((p) => ({ ...p, industry: undefined })); }}
          disabled={isPending}
          placeholder="예: IT / 소프트웨어"
        />
      </Field>

      {/* 사업자 증빙 서류 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-foreground-muted">
          사업자 증빙 서류 <span className="text-foreground-subtle">(선택 · PDF/JPG/PNG · 10MB 이하)</span>
        </label>
        <label className={`flex h-10 cursor-pointer items-center gap-2.5 rounded-md border px-3 text-sm transition-colors ${isPending ? "opacity-60 pointer-events-none" : "hover:bg-background-secondary"} ${docFileName ? "border-primary text-foreground" : "border-border text-foreground-muted"}`}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v-13A1.5 1.5 0 0 1 4.5 2h7.379a1.5 1.5 0 0 1 1.06.44l2.622 2.62A1.5 1.5 0 0 1 16 6.122V16.5A1.5 1.5 0 0 1 14.5 18h-10A1.5 1.5 0 0 1 3 16.5Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 12.5 10 9.5l3 3M10 9.5V15" />
          </svg>
          <span className="truncate">{docFileName ?? "파일 선택"}</span>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            disabled={isPending}
            onChange={(e) => setDocFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-foreground-muted">
          신청 메모 <span className="text-foreground-subtle">(선택)</span>
        </label>
        <textarea
          className="w-full rounded-md border border-border bg-background-primary px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-subtle disabled:opacity-60 resize-none"
          rows={2}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          disabled={isPending}
        />
      </div>

      {serverError && (
        <p role="alert" className="rounded-md bg-destructive-50 px-3 py-2 text-sm text-destructive-700">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "신청 중…" : "회사 등록 신청"}
      </Button>
      <Link href="/join-company" className="text-center text-sm text-foreground-muted hover:text-foreground">
        ← 가입 방법 다시 선택
      </Link>
    </form>
  );
}
