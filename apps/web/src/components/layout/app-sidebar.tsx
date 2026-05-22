"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    label: "홈",
    href: "/home",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
        <path d="M10.707 2.293a1 1 0 0 0-1.414 0l-7 7a1 1 0 0 0 1.414 1.414L4 10.414V17a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3h2v3a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-6.586l.293.293a1 1 0 0 0 1.414-1.414l-7-7Z" />
      </svg>
    ),
  },
  {
    label: "구성원",
    href: "/members",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
        <path d="M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM17 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 0 0-1.5-4.33A5 5 0 0 1 19 16v1h-6.07ZM6 11a5 5 0 0 1 5 5v1H1v-1a5 5 0 0 1 5-5Z" />
      </svg>
    ),
  },
  {
    label: "휴가",
    href: "/leave",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
        <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "전자결재",
    href: "/workflow",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
        <path fillRule="evenodd" d="M4 4a2 2 0 0 1 2-2h4.586A2 2 0 0 1 12 2.586L15.414 6A2 2 0 0 1 16 7.414V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Zm2 6a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1Zm1 3a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2H7Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "채용",
    href: "/recruit",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
        <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
      </svg>
    ),
  },
  {
    label: "문서",
    href: "/documents",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
        <path d="M3 3.5A1.5 1.5 0 0 1 4.5 2h6.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 1 .439 1.061V14.5A1.5 1.5 0 0 1 13.5 16h-9A1.5 1.5 0 0 1 3 14.5v-11Z" />
      </svg>
    ),
  },
  {
    label: "알림",
    href: "/notifications",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
        <path fillRule="evenodd" d="M4 8a6 6 0 1 1 12 0c0 1.887.454 3.665 1.257 5.234a.75.75 0 0 1-.515 1.076 32.91 32.91 0 0 1-3.256.508 3.5 3.5 0 0 1-6.972 0 32.903 32.903 0 0 1-3.256-.508.75.75 0 0 1-.515-1.076A11.448 11.448 0 0 0 4 8Zm6 7c-.655 0-1.305-.02-1.95-.057a2 2 0 0 0 3.9 0c-.645.038-1.295.057-1.95.057Z" clipRule="evenodd" />
      </svg>
    ),
  },
];

const SETTINGS_ITEMS = [
  { label: "휴가 정책", href: "/settings/leave-policies" },
  { label: "공휴일", href: "/settings/holidays" },
  { label: "권한 관리", href: "/settings/permissions" },
  { label: "양식 관리", href: "/settings/form-templates" },
  { label: "회사 설정", href: "/settings/company" },
  { label: "보안", href: "/settings/security" },
  { label: "개인 설정", href: "/settings/profile" },
];

export function AppSidebar({
  userName,
  userEmail,
  hasCompany,
}: {
  userName: string;
  userEmail: string;
  hasCompany: boolean;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/home" ? pathname === "/home" : pathname.startsWith(href);

  const isSettingsActive = SETTINGS_ITEMS.some((s) => pathname.startsWith(s.href));

  return (
    <aside className="flex w-56 flex-col border-r border-border bg-background-primary">
      {/* 워드마크 */}
      <div className="flex h-12 items-center border-b border-border px-4">
        <span className="text-sm font-semibold tracking-tight text-foreground">Teamlet</span>
      </div>

      {/* 메인 네비게이션 */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {hasCompany ? (
          <>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}

            {/* 설정 섹션 */}
            <div className="mt-2">
              <p className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-foreground-subtle">
                설정
              </p>
              {SETTINGS_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    pathname.startsWith(item.href)
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* 감사 로그 */}
            <Link
              href="/audit-log"
              className={`mt-0.5 flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                pathname === "/audit-log"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
              }`}
            >
              감사 로그
            </Link>
          </>
        ) : (
          <Link
            href="/join-company"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground-muted hover:bg-background-secondary hover:text-foreground"
          >
            회사 가입
          </Link>
        )}
      </nav>

      {/* 하단 사용자 정보 */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background-secondary text-xs font-medium text-foreground-muted">
            {userName.charAt(0) || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">{userName}</p>
            <p className="truncate text-[11px] text-foreground-subtle">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
