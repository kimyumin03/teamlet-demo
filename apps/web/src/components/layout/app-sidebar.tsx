"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Lucide 아이콘 path (디자인 app/icons.jsx 기준) — UI 아이콘은 전부 Lucide
const ICON: Record<string, string> = {
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  users: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8',
  calendar: 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3 10h18M8 2v4M16 2v4',
  workflow: 'M5 3h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM7 11v4a2 2 0 0 0 2 2h4M15 13h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z',
  folder: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z',
  settings:
    'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
  lock: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0v4',
  plus: 'M5 12h14M12 5v14',
};

function Icon({ name, size = 18 }: { name: keyof typeof ICON | string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: `<path d="${ICON[name] ?? ""}"/>` }}
    />
  );
}

type NavItem = { href: string; label: string; icon: keyof typeof ICON; attnBadge?: boolean };

// 디자인 shell.jsx 구조: 2그룹 (워크스페이스 / 인사 관리[관리자])
const NAV_WORKSPACE: NavItem[] = [
  { href: "/home", label: "홈", icon: "home" },
  { href: "/leave", label: "휴가", icon: "calendar" },
  { href: "/documents", label: "문서·증명서", icon: "folder" },
];

const NAV_ADMIN: NavItem[] = [
  { href: "/members", label: "구성원", icon: "users" },
  { href: "/workflow", label: "워크플로우", icon: "workflow", attnBadge: true },
  { href: "/hr/leave", label: "휴가 관리", icon: "calendar" },
];

const NAV_SETTINGS: NavItem[] = [
  { href: "/settings/profile", label: "설정", icon: "settings" },
];

export function AppSidebar({
  userName,
  userEmail,
  hasCompany,
  companyName,
  logoutAction,
  pendingCount,
  employeeId,
  isAdmin = false,
}: {
  userName: string;
  userEmail: string;
  hasCompany: boolean;
  companyName?: string;
  logoutAction: () => Promise<void>;
  pendingCount?: number;
  employeeId?: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/home" ? pathname === "/home" : pathname.startsWith(href);

  if (!hasCompany) {
    return (
      <aside className="side" style={{ width: 248 }}>
        <div className="org">
          <div className="org-logo">T</div>
          <div className="org-name">Teamlet</div>
        </div>
        <nav className="nav-group">
          <Link href="/join-company" className="nav-item">
            <Icon name="plus" />
            <span>회사 가입</span>
          </Link>
        </nav>
      </aside>
    );
  }

  const renderItem = (item: NavItem) => (
    <Link
      key={item.href}
      href={item.href}
      className={`nav-item${isActive(item.href) ? " active" : ""}`}
    >
      <Icon name={item.icon} />
      <span>{item.label}</span>
      {item.attnBadge && pendingCount != null && pendingCount > 0 && (
        <span className="badge attn">{pendingCount}</span>
      )}
    </Link>
  );

  return (
    <aside className="side" style={{ width: 248 }}>
      {/* 회사 로고 + 이름 */}
      <div className="org">
        <div className="org-logo">
          {(companyName ?? "T").charAt(0).toUpperCase()}
        </div>
        <div className="org-name">
          {companyName ?? "Teamlet"}
          <small>워크스페이스</small>
        </div>
      </div>

      {/* 워크스페이스 */}
      <nav className="nav-group">
        <div className="nav-label">워크스페이스</div>
        {NAV_WORKSPACE.map(renderItem)}
      </nav>

      {/* 인사 관리 (관리자만) */}
      {isAdmin && (
        <nav className="nav-group">
          <div className="nav-label admin">
            인사 관리
            <span className="nav-admin-tag" title="인사 관리자 권한">
              <Icon name="lock" size={10} />
              관리자
            </span>
          </div>
          {NAV_ADMIN.map(renderItem)}
        </nav>
      )}

      {/* 설정 (모든 사용자) */}
      <nav className="nav-group">
        {NAV_SETTINGS.map(renderItem)}
      </nav>

      {/* 하단 사용자 */}
      <div className="me" style={{ marginTop: "auto" }}>
        {employeeId ? (
          <Link href={`/members/${employeeId}`} style={{ display: "contents" }}>
            <div className="av" style={{ cursor: "pointer" }}>
              {userName.slice(-2) || "?"}
            </div>
            <div className="meta" style={{ cursor: "pointer" }}>
              <div className="name">{userName}</div>
              <div className="role">{userEmail}</div>
            </div>
          </Link>
        ) : (
          <>
            <div className="av">{userName.slice(-2) || "?"}</div>
            <div className="meta">
              <div className="name">{userName}</div>
              <div className="role">{userEmail}</div>
            </div>
          </>
        )}
        <form action={logoutAction}>
          <button
            type="submit"
            title="로그아웃"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-subtle)",
              display: "grid",
              placeItems: "center",
              padding: "4px",
              borderRadius: "6px",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              stroke="currentColor"
              strokeWidth="1.75"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </form>
      </div>
    </aside>
  );
}
