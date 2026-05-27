import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { isPlatformAdminEmail } from "@/lib/platform-admin";
import { getMembershipSummary } from "@teamlet/modules/tenancy";
import { listNotifications, countUnreadNotifications } from "@teamlet/modules/notification";
import { NotificationBell } from "@/components/notification/notification-bell";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { CommandPaletteTrigger } from "@/components/command-palette/command-palette-trigger";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (isPlatformAdminEmail(session.user.email)) redirect("/admin");

  const employeeId = session.user.employeeId;

  // 회사 없는 사용자: pending/rejected 여부에 따라 분기
  if (!employeeId) {
    const summary = await getMembershipSummary(session.user.id);
    if (summary.pending > 0 || summary.rejected) redirect("/pending-approval");
  }

  const [notifResult, unreadCount] = employeeId
    ? await Promise.all([
        listNotifications(employeeId),
        countUnreadNotifications(employeeId),
      ])
    : [{ ok: true as const, data: [] }, 0];

  const notifications = notifResult.ok ? notifResult.data : [];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 사이드바 */}
      <AppSidebar
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
        hasCompany={!!employeeId}
        logoutAction={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      />

      {/* 메인 영역 */}
      <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
        {/* 상단 헤더 */}
        <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-border bg-background-primary px-4">
          {employeeId && <CommandPaletteTrigger />}
          <div className="flex-1" />
          {employeeId && <CommandPalette />}
          <div className="flex items-center gap-2">
            {employeeId && (
              <NotificationBell items={notifications} unreadCount={unreadCount} />
            )}
            <Link
              href="/settings/profile"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-background-secondary text-xs font-medium text-foreground-muted hover:bg-background-tertiary transition-colors"
              title="개인 설정"
            >
              {session.user.name?.charAt(0).toUpperCase() ?? "?"}
            </Link>
          </div>
        </header>

        {/* 페이지 콘텐츠 */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
