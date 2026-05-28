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
  const [canSeeCompany, canSeeOps] = employeeId
    ? await Promise.all([
        hasPermission(employeeId, "company.basic_info.read"),
        hasPermission(employeeId, "permission.role.manage"),
      ])
    : [false, false];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 border-b border-border bg-background-primary">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
          {/* 왼쪽: 브레드크럼 */}
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/home"
              className="flex items-center gap-1.5 text-foreground-muted hover:text-foreground transition-colors"
            >
              {/* home icon */}
              <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 shrink-0">
                <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">홈</span>
            </Link>
            <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5 text-foreground-subtle shrink-0">
              <path d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06L7.28 11.78a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" />
            </svg>
            <span className="font-medium text-foreground">설정</span>
          </div>

          {/* 오른쪽: 유저 정보 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-background-secondary text-xs font-semibold text-foreground-muted ring-1 ring-border">
                {initials}
              </div>
              <span className="hidden sm:inline max-w-[120px] truncate">{session.user.name}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-md px-2.5 py-1 text-xs text-foreground-muted hover:bg-background-secondary hover:text-foreground transition-colors"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <div className="flex gap-8">
          {/* 사이드 네비게이션 */}
          <aside className="w-[248px] shrink-0">
            <div className="sticky top-[72px]">
              <p className="mb-4 text-[17px] font-bold tracking-tight text-foreground">설정</p>
              <SettingsNav canSeeCompany={canSeeCompany} canSeeOps={canSeeOps} />
            </div>
          </aside>

          {/* 구분선 */}
          <div className="w-px shrink-0 bg-border" />

          {/* 컨텐츠 */}
          <div className="min-w-0 flex-1 pb-16">{children}</div>
        </div>
      </div>
    </div>
  );
}
