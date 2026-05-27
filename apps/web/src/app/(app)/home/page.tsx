import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getMembershipSummary } from "@teamlet/modules/tenancy";
import { getLeaveBalances } from "@teamlet/modules/leave";
import { listPendingApprovals, listMyDocuments } from "@teamlet/modules/workflow";
import { listNotifications } from "@teamlet/modules/notification";
import { listAnnouncements } from "@teamlet/modules/announcement";
import { Button } from "@teamlet/ui";
import { HomeTabs } from "./_components/home-tabs";
import { FeedTab } from "./_components/feed-tab";
import { NewsTab } from "./_components/news-tab";
import { TasksTab } from "./_components/tasks-tab";

export const dynamic = "force-dynamic";

const VALID_TABS = ["feed", "news", "tasks"] as const;
type TabId = (typeof VALID_TABS)[number];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; view?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { tab, view } = await searchParams;
  const activeTab: TabId = VALID_TABS.includes(tab as TabId) ? (tab as TabId) : "feed";

  const summary = await getMembershipSummary(session.user.id);
  if (summary.active.length === 0) {
    redirect(summary.pending > 0 ? "/pending-approval" : "/join-company");
  }

  const employeeId = session.user.employeeId;
  const year = new Date().getFullYear();

  const [pendingResult, balancesResult, myDocsResult, notifResult, announcementsResult] = employeeId
    ? await Promise.all([
        listPendingApprovals(employeeId),
        getLeaveBalances(employeeId, year),
        listMyDocuments(employeeId),
        listNotifications(employeeId),
        listAnnouncements(employeeId),
      ])
    : [null, null, null, null, null];

  const pending = pendingResult?.ok ? pendingResult.data : [];
  const balances = balancesResult?.ok ? balancesResult.data : [];
  const myDocs = myDocsResult?.ok ? myDocsResult.data : [];
  const notifications = notifResult?.ok ? notifResult.data.filter((n) => !n.isRead) : [];
  const announcements = announcementsResult?.ok ? announcementsResult.data : [];

  const annualBalance = balances.find((b) => b.leaveTypeKey === "annual");

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* 인사말 */}
      <div className="mb-6">
        <p className="text-xs text-foreground-subtle">{today}</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          안녕하세요, {session.user.name}님
        </h1>
      </div>

      {/* 탭 네비게이션 */}
      <HomeTabs activeTab={activeTab} pendingCount={pending.length} />

      {/* 탭 콘텐츠 */}
      {activeTab === "feed" && (
        <FeedTab
          employeeId={employeeId}
          pending={pending}
          balances={balances}
          myDocs={myDocs}
          notifications={notifications}
          annualBalance={annualBalance}
          year={year}
        />
      )}
      {activeTab === "news" && <NewsTab subTab={view ?? "notice"} announcements={announcements} currentEmployeeId={employeeId ?? undefined} />}
      {activeTab === "tasks" && (
        <TasksTab pending={pending} myDocs={myDocs} />
      )}

    </div>
  );
}
