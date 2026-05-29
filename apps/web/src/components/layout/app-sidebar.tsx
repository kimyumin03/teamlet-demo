"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_MAIN = [
  {
    href: "/home",
    label: "홈",
    icon: (
      <svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>
    ),
  },
  {
    href: "/members",
    label: "구성원",
    icon: (
      <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="9" r="2.6"/><path d="M15 14c2.8 0 5.5 1.6 5.5 5"/></svg>
    ),
  },
  {
    href: "/leave",
    label: "휴가",
    icon: (
      <svg viewBox="0 0 24 24"><path d="M12 3v9"/><path d="M4 12a8 8 0 0 1 16 0"/><path d="M9 20l3-3 3 3"/></svg>
    ),
  },
  {
    href: "/workflow",
    label: "워크플로우",
    icon: (
      <svg viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M10 12h6M10 16h4"/></svg>
    ),
  },
];

const NAV_WORKSPACE = [
  {
    href: "/recruit",
    label: "채용",
    icon: (
      <svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/></svg>
    ),
  },
  {
    href: "/documents",
    label: "문서·증명서",
    icon: (
      <svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 13h7M9 17h5"/></svg>
    ),
  },
];

const NAV_ADMIN = [
  {
    href: "/hr/leave",
    label: "휴가 관리",
    icon: (
      <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h2m2 0h2M8 18h2"/></svg>
    ),
  },
  {
    href: "/settings/profile",
    label: "설정",
    icon: (
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2L10 21h4l.6-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5a7 7 0 0 0 .1-1.2z"/></svg>
    ),
  },
];

export function AppSidebar({
  userName,
  userEmail,
  hasCompany,
  companyName,
  logoutAction,
  pendingCount,
  employeeId,
}: {
  userName: string;
  userEmail: string;
  hasCompany: boolean;
  companyName?: string;
  logoutAction: () => Promise<void>;
  pendingCount?: number;
  employeeId?: string;
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
            <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            회사 가입
          </Link>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="side" style={{ width: 248 }}>
      {/* 회사 로고 + 이름 */}
      <div className="org">
        <div className="org-logo">
          {(companyName ?? "T").charAt(0).toUpperCase()}
        </div>
        <div className="org-name">
          {companyName ?? "Teamlet"}
          <small>구성원 서비스</small>
        </div>
      </div>

      {/* 메인 메뉴 */}
      <nav className="nav-group">
        {NAV_MAIN.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${isActive(item.href) ? " active" : ""}`}
          >
            {item.icon}
            {item.label}
            {item.href === "/workflow" && pendingCount != null && pendingCount > 0 && (
              <span className="badge attn">{pendingCount}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Workspace */}
      <nav className="nav-group">
        <div className="nav-label">워크스페이스</div>
        {NAV_WORKSPACE.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${isActive(item.href) ? " active" : ""}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* 운영 */}
      <nav className="nav-group">
        <div className="nav-label">운영</div>
        {NAV_ADMIN.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${isActive(item.href) ? " active" : ""}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* 하단 사용자 */}
      <div className="me" style={{ marginTop: "auto" }}>
        {employeeId ? (
          <Link href={`/members/${employeeId}`} style={{ display: "contents" }}>
            <div className="av" style={{ cursor: "pointer" }}>{userName.charAt(0) || "?"}</div>
            <div className="meta" style={{ cursor: "pointer" }}>
              <div className="name">{userName}</div>
              <div className="role">{userEmail}</div>
            </div>
          </Link>
        ) : (
          <>
            <div className="av">{userName.charAt(0) || "?"}</div>
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
            onMouseOver={(e) => (e.currentTarget.style.color = "var(--fg)")}
            onMouseOut={(e) => (e.currentTarget.style.color = "var(--fg-subtle)")}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </form>
      </div>
    </aside>
  );
}
