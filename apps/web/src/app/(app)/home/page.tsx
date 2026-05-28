import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMembershipSummary } from "@teamlet/modules/tenancy";
import { getLeaveBalances } from "@teamlet/modules/leave";
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

  const [pendingResult, balancesResult, myDocsResult, announcementsResult] = employeeId
    ? await Promise.all([
        listPendingApprovals(employeeId),
        getLeaveBalances(employeeId, year),
        listMyDocuments(employeeId),
        listAnnouncements(employeeId),
      ])
    : [null, null, null, null];

  const pending = pendingResult?.ok ? pendingResult.data : [];
  const balances = balancesResult?.ok ? balancesResult.data : [];
  const myDocs = myDocsResult?.ok ? myDocsResult.data : [];
  const announcements = announcementsResult?.ok ? announcementsResult.data : [];

  const annualBalance = balances.find((b) => b.leaveTypeKey === "annual");
  const firstName = session.user.name?.split(" ")[0] ?? session.user.name ?? "";
  const greeting = getGreeting();

  const today = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_340px] h-full">
      {/* 메인 피드 */}
      <main className="min-w-0 border-r border-border px-8 py-7">
        {/* 인사말 헤더 */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-[26px] font-bold leading-tight tracking-tight">
              {greeting}, {firstName}님{" "}
              <span
                className="inline-block"
                style={{ animation: "wave 1.6s ease-in-out 1", transformOrigin: "70% 70%" }}
              >
                👋
              </span>
            </h1>
            <p className="mt-1.5 text-[13px] text-foreground-muted">
              {today}
                <span className="ml-3 inline-flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 ring-[3px] ring-emerald-100" />
                {pending.length > 0 ? `결재 대기 ${pending.length}건` : "오늘도 좋은 하루"}
              </span>
            </p>
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

      {/* 오른쪽 레일 */}
      <HomeRail balances={balances} annualBalance={annualBalance} />
    </div>
  );
}
