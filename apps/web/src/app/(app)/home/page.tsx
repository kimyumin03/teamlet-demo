import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMembershipSummary } from "@teamlet/modules/tenancy";
import { getLeaveBalances, listTeamLeaveCalendar } from "@teamlet/modules/leave";
import { listPendingApprovals, listMyDocuments } from "@teamlet/modules/workflow";
import { listAnnouncements, getUnreadAnnouncementCount } from "@teamlet/modules/announcement";
import { listHomeEvents, countActiveEmployees, listEmployees } from "@teamlet/modules/employee";
import { listDepartments } from "@teamlet/modules/department";
import { listReceivedRecognitions } from "@teamlet/modules/recognition";
import { listCompanyHolidays } from "@teamlet/modules/tenancy";
import { hasPermission } from "@teamlet/modules/permission";
import { HomeTabs } from "./_components/home-tabs";
import { FeedTab } from "./_components/feed-tab";
import { NewsTab } from "./_components/news-tab";
import { RecognitionTab } from "./_components/recognition-tab";
import { HomeRail } from "./_components/home-rail";
import { SendToColleagueButton } from "@/components/home/send-to-colleague-button";

export const dynamic = "force-dynamic";

const VALID_TABS = ["feed", "news", "recognition"] as const;
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

  const { tab } = await searchParams;
  const activeTab: TabId = VALID_TABS.includes(tab as TabId) ? (tab as TabId) : "feed";

  const summary = await getMembershipSummary(session.user.id);
  if (summary.active.length === 0) {
    redirect(summary.pending > 0 ? "/pending-approval" : "/join-company");
  }

  const employeeId = session.user.employeeId;
  const year = new Date().getFullYear();

  const now = new Date();
  const month = now.getMonth() + 1;

  const [pendingResult, balancesResult, myDocsResult, announcementsResult, calendarResult, homeEvents, totalActive, holidaysResult, unreadResult, recognitionsReceived, employeesResult, departmentsResult] = employeeId
    ? await Promise.all([
        listPendingApprovals(employeeId),
        getLeaveBalances(employeeId, year),
        listMyDocuments(employeeId),
        listAnnouncements(employeeId),
        listTeamLeaveCalendar(employeeId, year, month),
        listHomeEvents(employeeId),
        countActiveEmployees(employeeId),
        listCompanyHolidays(employeeId, year),
        getUnreadAnnouncementCount(employeeId),
        listReceivedRecognitions(employeeId),
        listEmployees(employeeId),
        listDepartments(employeeId),
      ])
    : [null, null, null, null, null, [], 0, null, 0, [], null, null];

  const pending = pendingResult?.ok ? pendingResult.data : [];
  const balances = balancesResult?.ok ? balancesResult.data : [];
  const myDocs = myDocsResult?.ok ? myDocsResult.data : [];
  const announcements = announcementsResult?.ok ? announcementsResult.data : [];
  const events = Array.isArray(homeEvents) ? homeEvents : [];
  const activeCount = typeof totalActive === "number" ? totalActive : 0;
  const holidays = holidaysResult?.ok ? holidaysResult.data : [];
  const unreadCount = typeof unreadResult === "number" ? unreadResult : 0;
  const received = Array.isArray(recognitionsReceived) ? recognitionsReceived : [];
  const recogUnread = received.filter((r) => !r.isRead).length;
  const pickerEmployees = employeesResult && employeesResult.ok
    ? employeesResult.data
        .filter((e) => e.isActive && e.id !== employeeId)
        .map((e) => ({ id: e.id, name: e.name, departmentId: e.departmentId, departmentName: e.departmentName }))
    : [];
  const pickerDepartments = departmentsResult && departmentsResult.ok
    ? departmentsResult.data.map((d) => ({ id: d.id, name: d.name, parentId: d.parentId }))
    : [];
  const canAnnounce = employeeId ? await hasPermission(employeeId, "company.announcement.manage") : false;

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
                출근 {activeCount - todayAbsent.length} · 휴가 {todayAbsent.length}
              </span>
            </div>
          </div>
          <div className="feed-actions">
            <a href="/leave/requests" className="btn-sm btn-sm-ghost">휴가 신청</a>
            {employeeId && <SendToColleagueButton canAnnounce={canAnnounce} employees={pickerEmployees} departments={pickerDepartments} />}
          </div>
        </div>

        <HomeTabs
          activeTab={activeTab}
          pendingCount={pending.length}
          announcementCount={unreadCount}
          recognitionUnread={recogUnread}
        />

        {activeTab === "feed" && (
          <FeedTab
            employeeId={employeeId}
            pending={pending}
            balances={balances}
            myDocs={myDocs}
            annualBalance={annualBalance}
            announcements={announcements}
            events={events}
            year={year}
          />
        )}
        {activeTab === "news" && (
          <NewsTab
            announcements={announcements}
            currentEmployeeId={employeeId ?? undefined}
            unreadCount={unreadCount}
          />
        )}
        {activeTab === "recognition" && <RecognitionTab items={received} />}
      </main>

      <HomeRail
        balances={balances}
        annualBalance={annualBalance}
        todayAbsent={todayAbsent}
        events={events}
        activeCount={activeCount}
        holidays={holidays}
        monthCalendar={calendarResult?.ok ? calendarResult.data : []}
      />
    </div>
  );
}
