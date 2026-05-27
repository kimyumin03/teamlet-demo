"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS = [
  {
    label: "개인",
    items: [{ href: "/settings/profile", label: "개인 설정" }],
  },
  {
    label: "회사",
    items: [
      { href: "/settings/company", label: "회사 정보" },
      { href: "/settings/holidays", label: "공휴일" },
      { href: "/settings/security", label: "보안 설정" },
    ],
  },
  {
    label: "운영",
    items: [
      { href: "/settings/permissions", label: "권한 설정" },
      { href: "/settings/leave-types", label: "휴가 종류" },
      { href: "/settings/leave-policies", label: "휴가 정책" },
      { href: "/settings/approval-policies", label: "결재 정책" },
      { href: "/settings/form-templates", label: "양식 관리" },
      { href: "/audit-log", label: "감사 로그" },
    ],
  },
] as const;

export function SettingsNav({
  canSeeCompany = false,
  canSeeOps = false,
}: {
  canSeeCompany?: boolean;
  canSeeOps?: boolean;
}) {
  const pathname = usePathname();

  const visibleGroups = GROUPS.filter((g) => {
    if (g.label === "회사") return canSeeCompany;
    if (g.label === "운영") return canSeeOps;
    return true; // 개인 — 항상 표시
  });

  return (
    <nav className="flex flex-col gap-5">
      {visibleGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-2 text-xs font-medium text-foreground-subtle">
            {group.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-lg px-2 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "bg-background-secondary font-medium text-foreground"
                        : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
