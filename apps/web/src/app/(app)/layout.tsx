import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listNotifications, countUnreadNotifications } from "@teamlet/modules/notification";
import { NotificationBell } from "@/components/notification/notification-bell";

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
      <header className="sticky top-0 z-40 flex h-12 items-center justify-end border-b border-border bg-background-primary px-4">
        {employeeId && (
          <NotificationBell items={notifications} unreadCount={unreadCount} />
        )}
      </header>
      {children}
    </div>
  );
}
