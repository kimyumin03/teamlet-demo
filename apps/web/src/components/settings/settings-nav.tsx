"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; sub: string; disabled?: boolean };

const GROUPS: { label: string; admin?: boolean; items: NavItem[] }[] = [
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
      { href: "/settings/holidays", label: "공휴일", sub: "한국 · 회사 자율" },
      { href: "/settings/org", label: "조직 · 직책", sub: "부서 · 직급 편집/삭제" },
    ],
  },
  {
    label: "휴가",
    admin: true,
    items: [
      { href: "/settings/leave-policies", label: "연차 설정", sub: "연차 정책 · 부여 규칙" },
      { href: "/settings/leave-types", label: "맞춤 휴가", sub: "법정·자율 휴가 종류 관리" },
    ],
  },
  {
    label: "운영",
    admin: true,
    items: [
      { href: "/settings/permissions", label: "권한 그룹", sub: "역할 · 범위" },
      { href: "/settings/approval-policies", label: "워크플로우", sub: "결재선 · 템플릿" },
      { href: "/documents", label: "문서함", sub: "유형 · 보관 · 자동" },
      { href: "/audit-log", label: "감사 로그", sub: "관리자 활동" },
    ],
  },
] as const;

export function SettingsNav({
  canSeeCompany = false,
  canSeeOps = false,
  canSeeLeave = false,
}: {
  canSeeCompany?: boolean;
  canSeeOps?: boolean;
  canSeeLeave?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5">
      {GROUPS.map((group) => {
        if (group.label === "회사" && !canSeeCompany) return null;
        if (group.label === "휴가" && !(canSeeLeave || canSeeOps)) return null;
        if (group.label === "운영" && !canSeeOps) return null;
        return (
          <div key={group.label} className="flex flex-col gap-0.5">
            <div className="mb-1.5 flex items-center gap-1.5 px-2.5">
              <span className="text-[10.5px] font-semibold uppercase tracking-widest text-foreground-subtle">
                {group.label}
              </span>
              {group.admin && (
                <span className="rounded-[3px] bg-foreground px-1.5 py-px font-mono text-[8.5px] font-bold uppercase tracking-normal text-background-primary">
                  ADMIN
                </span>
              )}
            </div>
            {group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-[7px] px-2.5 py-2 transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
                  }`}
                >
                  <span className={`block text-[12.5px] leading-snug ${isActive ? "font-semibold" : "font-medium"}`}>
                    {item.label}
                  </span>
                  <span className={`mt-0.5 block font-mono text-[10.5px] leading-snug ${isActive ? "text-primary/70" : "text-foreground-subtle"}`}>
                    {item.sub}
                  </span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
