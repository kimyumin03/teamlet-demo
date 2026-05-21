import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listNotifications, countUnreadNotifications } from "@teamlet/modules/notification";
import { NotificationList } from "@/components/notification/notification-list";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");

  const { filter = "" } = await searchParams;

  const [listResult, unreadCount] = await Promise.all([
    listNotifications(session.user.employeeId),
    countUnreadNotifications(session.user.employeeId),
  ]);

  const items = listResult.ok ? listResult.data : [];

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">알림</h1>
        <p className="mt-0.5 text-sm text-foreground-muted">
          최근 알림 {items.length}건
          {unreadCount > 0 && ` · 안 읽음 ${unreadCount}건`}
        </p>
      </div>

      <NotificationList items={items} unreadCount={unreadCount} filter={filter} />
    </div>
  );
}
