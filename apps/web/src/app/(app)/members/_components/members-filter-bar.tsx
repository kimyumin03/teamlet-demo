"use client";

import type { ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type DeptOption = { id: string; name: string };

const CHIP =
  "h-8 rounded-full border border-border bg-background-primary pl-3 pr-7 text-[12.5px] text-foreground-muted hover:border-border-strong hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none";

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={CHIP}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-2 h-3 w-3 text-foreground-subtle"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  );
}

export function MembersFilterBar({
  departments,
  initialQ,
}: {
  departments: DeptOption[];
  initialQ: string;
}) {
  const params = useSearchParams();
  const router = useRouter();

  function navigate(overrides: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.push(`/members?${next.toString()}`);
  }

  const dept = params.get("department") ?? "";
  const status = params.get("status") ?? "";
  const empType = params.get("empType") ?? "";

  return (
    <div className="flex items-center gap-2">
      <FilterSelect
        value={dept}
        onChange={(v) => navigate({ department: v, status, empType })}
      >
        <option value="">조직 · 전사</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </FilterSelect>

      <FilterSelect
        value={status}
        onChange={(v) => navigate({ department: dept, status: v, empType })}
      >
        <option value="">재직 상태 · 전체</option>
        <option value="active">재직 중</option>
        <option value="resigned">퇴직</option>
      </FilterSelect>

      <FilterSelect
        value={empType}
        onChange={(v) => navigate({ department: dept, status, empType: v })}
      >
        <option value="">근로유형 · 전체</option>
        <option value="FULL_TIME">정규직</option>
        <option value="PART_TIME">파트타임</option>
        <option value="CONTRACT">계약직</option>
        <option value="INTERN">인턴</option>
        <option value="DISPATCH">파견</option>
      </FilterSelect>

      <div className="flex-1" />

      {/* 검색 */}
      <div className="relative w-52">
        <svg
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-subtle"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          defaultValue={initialQ}
          placeholder="이름 · 사번 · 이메일"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              navigate({ department: dept, status, empType, q: (e.target as HTMLInputElement).value });
            }
          }}
          className="h-8 w-full rounded-full border border-border bg-background-primary pl-8 pr-3 text-[12.5px] placeholder:text-foreground-subtle focus-visible:outline-none focus-visible:border-border-strong"
        />
      </div>

      <a
        href="/api/members/export"
        download
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background-primary px-3 text-[12.5px] text-foreground-muted hover:border-border-strong hover:text-foreground transition-colors"
      >
        ↓ 내보내기
      </a>
    </div>
  );
}
