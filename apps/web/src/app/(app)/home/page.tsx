import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMembershipSummary } from "@teamlet/modules/tenancy";
import { getLeaveBalances, listTeamLeaveCalendar } from "@teamlet/modules/leave";
import { listPendingApprovals, listMyDocuments } from "@teamlet/modules/workflow";
import { listAnnouncements } from "@teamlet/modules/announcement";
import { HomeTabs } from "./_components/home-tabs";
import { FeedTab } from "./_components/feed-tab";
import { NewsTab } from "./_components/news-tab";
import { TasksTab } from "./_components/tasks-tab";
import { HomeRail } from "./_components/home-rail";

export const dynamic = "force-dynamic";

const VALID_TABS = ["feed", "news", "tasks"] as const;
type TabId = (typeof VALID_TABS)[number];

function getGreeting(): string {
  const hour = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  ).getHours();
  if (hour < 12) return "좋은 아침이에요";
  if (hour < 18) return "좋은 오후예요";
  return "좋은 저녁이에요";
}

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

  const now = new Date();
  const month = now.getMonth() + 1;

  const [pendingResult, balancesResult, myDocsResult, announcementsResult, calendarResult] = employeeId
    ? await Promise.all([
        listPendingApprovals(employeeId),
        getLeaveBalances(employeeId, year),
        listMyDocuments(employeeId),
        listAnnouncements(employeeId),
        listTeamLeaveCalendar(employeeId, year, month),
      ])
    : [null, null, null, null, null];

  const pending = pendingResult?.ok ? pendingResult.data : [];
  const balances = balancesResult?.ok ? balancesResult.data : [];
  const myDocs = myDocsResult?.ok ? myDocsResult.data : [];
  const announcements = announcementsResult?.ok ? announcementsResult.data : [];

  // 오늘 부재 중인 동료
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const todayAbsent = (calendarResult?.ok ? calendarResult.data : []).filter((r) => {
    const s = new Date(r.startDate); s.setHours(0, 0, 0, 0);
    const e = new Date(r.endDate); e.setHours(23, 59, 59, 999);
    return s <= todayEnd && e >= todayStart && r.employeeId !== employeeId;
  });

  const annualBalance = balances.find((b) => b.leaveTypeKey === "annual");
  const firstName = session.user.name?.split(" ")[0] ?? session.user.name ?? "";
  const greeting = getGreeting();

  const today = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="work">
      <main className="feed">
        {/* 인사말 헤더 */}
        <div className="feed-head">
          <div>
            <h1 className="h-title-h">
              {greeting}, {firstName}님 <span className="wave">👋</span>
            </h1>
            <div className="h-sub-h">
              {today}
              <span className="ping">
                <i />
                {pending.length > 0 ? `결재 대기 ${pending.length}건` : "오늘도 좋은 하루"}
              </span>
            </div>
          </div>
        </div>

        <HomeTabs
          activeTab={activeTab}
          pendingCount={pending.length}
          announcementCount={announcements.length}
        />

        {activeTab === "feed" && (
          <FeedTab
            employeeId={employeeId}
            pending={pending}
            balances={balances}
            myDocs={myDocs}
            annualBalance={annualBalance}
            announcements={announcements}
            year={year}
          />
        )}
        {activeTab === "news" && (
          <NewsTab
            subTab={view ?? "notice"}
            announcements={announcements}
            currentEmployeeId={employeeId ?? undefined}
          />
        )}
        {activeTab === "tasks" && (
          <TasksTab pending={pending} myDocs={myDocs} />
        )}
      </main>

      <HomeRail balances={balances} annualBalance={annualBalance} todayAbsent={todayAbsent} />
    </div>
  );
}
