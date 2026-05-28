"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; sub: string };
type Group = { label: string; admin?: boolean; items: NavItem[] };

const GROUPS: Group[] = [
  {
    label: "개인",
    items: [
      { href: "/settings/profile", label: "프로필", sub: "이름 · 연락처" },
      { href: "/settings/security", label: "보안", sub: "2FA · 세션" },
      { href: "/settings/notifications", label: "알림", sub: "이메일 · 슬랙" },
    ],
  },
  {
    label: "회사",
    admin: true,
    items: [
      { href: "/settings/company", label: "회사 정보", sub: "대표 · 주소 · 로고" },
      { href: "/settings/holidays", label: "공휴일", sub: "한국 + 회사 자율" },
      { href: "/settings/organization", label: "조직 · 직책", sub: "본부 · 팀 · 직급" },
    ],
  },
  {
    label: "운영",
    admin: true,
    items: [
      { href: "/settings/permissions", label: "권한 그룹", sub: "역할 · 범위" },
      { href: "/settings/leave-policy", label: "휴가 정책", sub: "종류 · 부여 규칙" },
      { href: "/settings/workflow-templates", label: "워크플로우", sub: "결재선 · 템플릿" },
      { href: "/settings/documents", label: "문서함", sub: "유형 · 보관 · 자동" },
      { href: "/settings/audit", label: "감사 로그", sub: "관리자 활동" },
    ],
  },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 h-screen bg-[var(--bg-primary)] border-r border-[var(--border)] p-3 pt-4.5 overflow-y-auto">
      {GROUPS.map((g) => (
        <div key={g.label} className="mb-4.5">
          <h4 className="text-[10.5px] text-[var(--fg-subtle)] uppercase tracking-[0.08em] mx-2.5 mb-1.5 font-semibold flex items-center gap-1.5">
            {g.label}
            {g.admin && (
              <span className="mono text-[9px] bg-[var(--fg)] text-[var(--bg-primary)] px-1.5 py-px rounded tracking-normal">
                ADMIN
              </span>
            )}
          </h4>
          {g.items.map((it) => {
            const active = pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "block px-3 py-1.5 rounded-md text-[12.5px] leading-[1.5] mb-px",
                  active
                    ? "bg-[var(--primary-soft)] text-[var(--primary)] font-semibold"
                    : "text-[var(--fg-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--fg)]"
                )}
              >
                {it.label}
                <small className={cn(
                  "block text-[10.5px] mono font-medium mt-px",
                  active ? "text-[var(--primary)] opacity-70" : "text-[var(--fg-subtle)]"
                )}>
                  {it.sub}
                </small>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
