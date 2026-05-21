import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listNotifications, countUnreadNotifications } from "@teamlet/modules/notification";
import { NotificationBell } from "@/components/notification/notification-bell";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { CommandPaletteTrigger } from "@/components/command-palette/command-palette-trigger";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const employeeId = session.user.employeeId;

  const [notifResult, unreadCount] = employeeId
    ? await Promise.all([
        listNotifications(employeeId),
        countUnreadNotifications(employeeId),
      ])
    : [{ ok: true as const, data: [] }, 0];

  const notifications = notifResult.ok ? notifResult.data : [];

  return (
    <div className="min-h-screen bg-background">
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
      {children}
    </div>
  );
}
