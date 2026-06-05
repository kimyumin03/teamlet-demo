import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { isPlatformAdminEmail } from "@/lib/platform-admin";
import { getMembershipSummary, getCompanyInfo } from "@teamlet/modules/tenancy";
import { listNotifications, countUnreadNotifications } from "@teamlet/modules/notification";
import { listPendingApprovals } from "@teamlet/modules/workflow";
import { hasPermission } from "@teamlet/modules/permission";
import { NotificationBell } from "@/components/notification/notification-bell";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { CommandPaletteTrigger } from "@/components/command-palette/command-palette-trigger";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (isPlatformAdminEmail(session.user.email)) redirect("/admin");

  const employeeId = session.user.employeeId;

  if (!employeeId) {
    const summary = await getMembershipSummary(session.user.id);
    if (summary.pending > 0 || summary.rejected) redirect("/pending-approval");
  }

  const [notifResult, unreadCount, companyResult, pendingResult] = employeeId
    ? await Promise.all([
        listNotifications(employeeId),
        countUnreadNotifications(employeeId),
        getCompanyInfo(employeeId),
        listPendingApprovals(employeeId),
      ])
    : [
        { ok: true as const, data: [] },
        0,
        { ok: false as const, error: "no employee" as never },
        { ok: true as const, data: [] },
      ];

  const notifications = notifResult.ok ? notifResult.data : [];
  const companyName = companyResult.ok ? companyResult.data.name : undefined;
  const pendingCount = pendingResult.ok ? pendingResult.data.length : 0;
  // 검색에서 전체 페이지 노출 여부 (관리자 권한). 일반 팀원은 공개 페이지만.
  const canSeeAllPages = employeeId ? await hasPermission(employeeId, "member.directory.manage") : false;

  const logoutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <div className="app">
      {/* 사이드바 */}
      <AppSidebar
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
        hasCompany={!!employeeId}
        companyName={companyName}
        pendingCount={pendingCount}
        logoutAction={logoutAction}
        employeeId={employeeId ?? undefined}
      />

      {/* 메인 영역 */}
      <div className="main">
        {/* 탑바 */}
        <header className="topbar">
          {employeeId && <CommandPaletteTrigger />}
          {employeeId && <CommandPalette isAdmin={canSeeAllPages} />}
          <div className="top-actions">
            {employeeId && (
              <NotificationBell items={notifications} unreadCount={unreadCount} />
            )}
          </div>
        </header>

        {/* 페이지 콘텐츠 */}
        <main style={{ minHeight: 0, overflowY: "auto" }}>{children}</main>
      </div>
    </div>
  );
}
