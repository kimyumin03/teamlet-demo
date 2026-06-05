import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { isPlatformAdminEmail } from "@/lib/platform-admin";
import { hasPermission } from "@teamlet/modules/permission";
import { SettingsNav } from "@/components/settings/settings-nav";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (isPlatformAdminEmail(session.user.email)) redirect("/admin");

  const initials = (session.user.name ?? "?")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  const employeeId = session.user.employeeId;
  const [canSeeCompany, canSeeOps, canSeeLeave] = employeeId
    ? await Promise.all([
        hasPermission(employeeId, "company.basic_info.read"),
        hasPermission(employeeId, "permission.role.manage"),
        hasPermission(employeeId, "leave.policy.manage"),
      ])
    : [false, false, false];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      {/* 설정 사이드 네비 */}
      <nav className="sticky top-0 h-screen w-[220px] shrink-0 bg-[var(--bg-primary)] border-r border-[var(--border)] p-3 pt-4 overflow-y-auto">
        <div className="flex items-center gap-2 px-2.5 mb-5 pb-4 border-b border-[var(--border)]">
          <Link href="/home" className="flex items-center gap-1.5 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors text-[12.5px]">
            <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0">
              <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clipRule="evenodd" />
            </svg>
            홈
          </Link>
          <svg viewBox="0 0 16 16" fill="currentColor" className="size-3 text-[var(--fg-subtle)]">
            <path d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06L7.28 11.78a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" />
          </svg>
          <span className="text-[12.5px] font-semibold text-[var(--fg)]">설정</span>
        </div>
        <SettingsNav canSeeCompany={canSeeCompany} canSeeOps={canSeeOps} canSeeLeave={canSeeLeave} />
      </nav>

      {/* 콘텐츠 */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {/* 상단 바 */}
        <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-primary)] px-6">
          <span className="text-[13px] font-semibold text-[var(--fg)]">설정</span>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[var(--fg-muted)]">{session.user.name}</span>
            <Link
              href="/home"
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[12.5px] text-[var(--fg-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--fg)] transition-colors"
              title="설정 닫기"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
              </svg>
              닫기
            </Link>
          </div>
        </header>
        <main className="px-8 pt-7 pb-16 min-w-0">{children}</main>
      </div>
    </div>
  );
}
