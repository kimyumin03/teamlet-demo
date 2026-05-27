"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    label: "홈",
    href: "/home",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0">
        <path d="M10.707 2.293a1 1 0 0 0-1.414 0l-7 7a1 1 0 0 0 1.414 1.414L4 10.414V17a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3h2v3a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-6.586l.293.293a1 1 0 0 0 1.414-1.414l-7-7Z" />
      </svg>
    ),
  },
  {
    label: "구성원",
    href: "/members",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0">
        <path d="M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM17 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 0 0-1.5-4.33A5 5 0 0 1 19 16v1h-6.07ZM6 11a5 5 0 0 1 5 5v1H1v-1a5 5 0 0 1 5-5Z" />
      </svg>
    ),
  },
  {
    label: "휴가",
    href: "/leave",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0">
        <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "워크플로우",
    href: "/workflow",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0">
        <path fillRule="evenodd" d="M4 4a2 2 0 0 1 2-2h4.586A2 2 0 0 1 12 2.586L15.414 6A2 2 0 0 1 16 7.414V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Zm2 6a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1Zm1 3a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2H7Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "휴가 관리",
    href: "/hr/leave",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0">
        <path d="M9 2a1 1 0 0 0-1 1v1H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3V3a1 1 0 0 0-1-1H9Zm-1 8a1 1 0 0 1 2 0v3a1 1 0 0 1-2 0v-3Zm5-1a1 1 0 0 1 1 1v3a1 1 0 0 1-2 0v-3a1 1 0 0 1 1-1Zm-7 1a1 1 0 0 1 2 0v3a1 1 0 0 1-2 0v-3Z" />
      </svg>
    ),
  },
  {
    label: "채용",
    href: "/recruit",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0">
        <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
      </svg>
    ),
  },
  {
    label: "문서",
    href: "/documents",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0">
        <path d="M3 3.5A1.5 1.5 0 0 1 4.5 2h6.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 1 .439 1.061V14.5A1.5 1.5 0 0 1 13.5 16h-9A1.5 1.5 0 0 1 3 14.5v-11Z" />
      </svg>
    ),
  },
];

const SETTINGS_ICON = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0">
    <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .205 1.251l-1.18 2.044a1 1 0 0 1-1.186.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.113a7.047 7.047 0 0 1 0-2.228L1.821 7.773a1 1 0 0 1-.205-1.251l1.18-2.044a1 1 0 0 1 1.186-.447l1.598.54A6.993 6.993 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
  </svg>
);

export function AppSidebar({
  userName,
  userEmail,
  hasCompany,
  logoutAction,
}: {
  userName: string;
  userEmail: string;
  hasCompany: boolean;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // 창 너비 768px 미만이면 자동 접힘, 이상이면 자동 펼침
  useEffect(() => {
    function handleResize() {
      setCollapsed(window.innerWidth < 768);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => !c);
  }

  const isActive = (href: string) =>
    href === "/home" ? pathname === "/home" : pathname.startsWith(href);

  return (
    <aside
      className={`flex flex-col border-r border-border bg-background-primary transition-all duration-200 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      {/* 워드마크 + 토글 */}
      <div className="flex h-12 items-center justify-between border-b border-border px-3">
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight text-foreground">Teamlet</span>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
          className={`rounded-md p-1 text-foreground-subtle hover:bg-background-secondary hover:text-foreground transition-colors ${collapsed ? "mx-auto" : ""}`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
            {collapsed ? (
              <path fillRule="evenodd" d="M3 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1ZM3 10a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1ZM3 15a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M3 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1ZM3 10a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1ZM3 15a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Z" clipRule="evenodd" />
            )}
          </svg>
        </button>
      </div>

      {/* 메인 네비게이션 */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {hasCompany ? (
          NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-2.5 rounded-lg py-2 text-sm transition-colors ${
                collapsed ? "justify-center px-2" : "px-3"
              } ${
                isActive(item.href)
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
              }`}
            >
              {item.icon}
              {!collapsed && item.label}
            </Link>
          ))
        ) : (
          <Link
            href="/join-company"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground-muted hover:bg-background-secondary hover:text-foreground"
          >
            회사 가입
          </Link>
        )}
      </nav>

      {/* 설정 */}
      {hasCompany && (
        <div className="border-t border-border p-2">
          <Link
            href="/settings/profile"
            title={collapsed ? "설정" : undefined}
            className={`flex items-center gap-2.5 rounded-lg py-2 text-sm transition-colors ${
              collapsed ? "justify-center px-2" : "px-3"
            } ${
              pathname.startsWith("/settings")
                ? "bg-primary/10 text-primary font-medium"
                : "text-foreground-muted hover:bg-background-secondary hover:text-foreground"
            }`}
          >
            {SETTINGS_ICON}
            {!collapsed && "설정"}
          </Link>
        </div>
      )}

      {/* 하단 사용자 정보 + 로그아웃 */}
      <div className="border-t border-border p-3">
        <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
          <div
            title={collapsed ? `${userName} (${userEmail})` : undefined}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background-secondary text-xs font-medium text-foreground-muted"
          >
            {userName.charAt(0) || "?"}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{userName}</p>
                <p className="truncate text-[11px] text-foreground-subtle">{userEmail}</p>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  title="로그아웃"
                  className="rounded p-1 text-foreground-subtle hover:bg-background-secondary hover:text-foreground transition-colors"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
                    <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-1.08a.75.75 0 1 0-1.004-1.12l-2.5 2.5a.75.75 0 0 0 0 1.04l2.5 2.5a.75.75 0 1 0 1.004-1.12L8.704 10.75H18.25A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
