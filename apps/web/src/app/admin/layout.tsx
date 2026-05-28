import { auth, signOut } from "@/auth";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { getPlatformStats } from "@teamlet/modules/tenancy";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requirePlatformAdmin();
  const stats = await getPlatformStats();

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar
        adminName={admin.name}
        adminEmail={admin.email}
        pendingCount={stats.pendingApplications}
      />

      <div className="flex flex-1 flex-col min-w-0">
        {/* 상단 바 */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-background-primary px-6">
          <div className="flex items-center gap-2 text-xs text-foreground-subtle">
            <span className="font-medium text-foreground">Teamlet 운영 콘솔</span>
          </div>
          <div className="flex items-center gap-3">
            {stats.pendingApplications > 0 && (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                신청 대기 {stats.pendingApplications}건
              </span>
            )}
            <span className="text-xs text-foreground-subtle">{admin.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded px-2 py-1 text-xs text-foreground-subtle hover:bg-background-secondary hover:text-foreground transition-colors"
              >
                로그아웃
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
