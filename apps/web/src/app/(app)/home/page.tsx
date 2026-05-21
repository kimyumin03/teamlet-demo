import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getMembershipSummary } from "@teamlet/modules/tenancy";
import { getLeaveBalances } from "@teamlet/modules/leave";
import { listPendingApprovals, listMyDocuments } from "@teamlet/modules/workflow";
import { listNotifications } from "@teamlet/modules/notification";
import { Button } from "@teamlet/ui";

export const dynamic = "force-dynamic";

const STATUS_CLASS: Record<string, string> = {
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  APPROVED: "bg-background-secondary text-foreground-muted",
  REJECTED: "bg-destructive-50 text-destructive-700",
  DRAFT: "bg-background-secondary text-foreground-subtle",
  CANCELLED: "bg-background-secondary text-foreground-subtle",
};
const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: "진행중", APPROVED: "승인", REJECTED: "반려", DRAFT: "임시저장", CANCELLED: "취소",
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

function StatCard({ label, value, sub, href }: { label: string; value: string | number; sub?: string; href: string }) {
  return (
    <Link href={href} className="flex flex-col gap-1 rounded-xl border border-border bg-background-primary p-5 transition-colors hover:bg-background-secondary">
      <p className="text-xs text-foreground-subtle">{label}</p>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-foreground-muted">{sub}</p>}
    </Link>
  );
}

const NAV_LINKS = [
  { href: "/members", label: "구성원" },
  { href: "/leave", label: "휴가" },
  { href: "/workflow", label: "워크플로우" },
  { href: "/recruit", label: "채용" },
  { href: "/documents", label: "문서" },
  { href: "/audit-log", label: "감사 로그" },
  { href: "/settings/company", label: "회사 설정" },
  { href: "/settings/leave-policies", label: "휴가 정책" },
  { href: "/settings/holidays", label: "공휴일" },
  { href: "/settings/form-templates", label: "양식 관리" },
  { href: "/settings/permissions", label: "권한 설정" },
  { href: "/settings/security", label: "보안 설정" },
];

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const summary = await getMembershipSummary(session.user.id);
  if (summary.active.length === 0) {
    redirect(summary.pending > 0 ? "/pending-approval" : "/join-company");
  }

  const employeeId = session.user.employeeId;
  const year = new Date().getFullYear();

  const [pendingResult, balancesResult, myDocsResult, notifResult] = employeeId
    ? await Promise.all([
        listPendingApprovals(employeeId),
        getLeaveBalances(employeeId, year),
        listMyDocuments(employeeId),
        listNotifications(employeeId),
      ])
    : [null, null, null, null];

  const pending = pendingResult?.ok ? pendingResult.data : [];
  const balances = balancesResult?.ok ? balancesResult.data : [];
  const myDocs = myDocsResult?.ok ? myDocsResult.data.slice(0, 5) : [];
  const notifications = notifResult?.ok ? notifResult.data.filter((n) => !n.isRead).slice(0, 4) : [];

  const annualBalance = balances.find((b) => b.leaveTypeKey === "annual");
  const inProgressDocs = myDocs.filter((d) => d.status === "IN_PROGRESS").length;

  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* 인사말 */}
      <div className="mb-8">
        <p className="text-sm text-foreground-muted">{today}</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          안녕하세요, {session.user.name}님 👋
        </h1>
      </div>

      {/* 요약 카드 */}
      {employeeId && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="결재 대기"
            value={pending.length}
            sub={pending.length > 0 ? "내 승인 필요" : "모두 처리됐어요"}
            href="/workflow"
          />
          <StatCard
            label={`연차 잔여 (${year})`}
            value={annualBalance ? `${annualBalance.remainingDays}일` : "—"}
            sub={annualBalance ? `총 ${annualBalance.grantedDays}일 중` : "잔여 정보 없음"}
            href="/leave"
          />
          <StatCard
            label="진행 중 문서"
            value={inProgressDocs}
            sub="내가 작성한 문서"
            href="/workflow"
          />
          <StatCard
            label="안 읽은 알림"
            value={notifications.length}
            sub={notifications.length > 0 ? "확인해 주세요" : "새 알림 없음"}
            href="/workflow"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* 왼쪽: 결재 대기 + 최근 문서 */}
        <div className="flex flex-col gap-6">
          {/* 결재 대기 */}
          {pending.length > 0 && (
            <section className="rounded-xl border border-amber-200 bg-amber-50/40">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="text-sm font-medium text-foreground">결재 대기</h2>
                <Link href="/workflow" className="text-xs text-foreground-muted hover:text-foreground">전체 보기 →</Link>
              </div>
              <ul className="flex flex-col divide-y divide-amber-100">
                {pending.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <Link href={`/workflow/documents/${item.documentId}`} className="flex items-center justify-between px-5 py-3 hover:bg-amber-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.documentTitle}</p>
                        <p className="text-xs text-foreground-muted">{item.authorName} · {item.step}/{item.totalSteps}단계 · {formatDate(item.createdAt)}</p>
                      </div>
                      <span className="ml-3 shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-xs text-amber-700">승인 필요</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 최근 내 문서 */}
          <section className="rounded-xl border border-border bg-background-primary">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-sm font-medium text-foreground">최근 문서</h2>
              <Link href="/workflow" className="text-xs text-foreground-muted hover:text-foreground">전체 보기 →</Link>
            </div>
            {myDocs.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-foreground-muted">작성한 문서가 없어요.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {myDocs.map((doc) => (
                  <li key={doc.id}>
                    <Link href={`/workflow/documents/${doc.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-background-secondary transition-colors">
                      <div>
                        <p className="text-sm font-medium text-foreground">{doc.title}</p>
                        <p className="text-xs text-foreground-muted">{formatDate(doc.createdAt)} · {doc.currentStep !== null ? `${doc.currentStep}/${doc.totalSteps}단계` : `${doc.totalSteps}단계`}</p>
                      </div>
                      <span className={`ml-3 shrink-0 rounded-md px-2 py-0.5 text-xs ${STATUS_CLASS[doc.status] ?? ""}`}>
                        {STATUS_LABEL[doc.status] ?? doc.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* 오른쪽: 휴가 잔여 + 알림 + 퀵 링크 */}
        <div className="flex flex-col gap-6">
          {/* 휴가 잔여 */}
          {balances.length > 0 && (
            <section className="rounded-xl border border-border bg-background-primary">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="text-sm font-medium text-foreground">휴가 잔여 ({year})</h2>
                <Link href="/leave" className="text-xs text-foreground-muted hover:text-foreground">신청 →</Link>
              </div>
              <ul className="flex flex-col divide-y divide-border">
                {balances.slice(0, 5).map((b) => (
                  <li key={b.leaveTypeId} className="flex items-center justify-between px-5 py-2.5">
                    <span className="text-sm text-foreground">{b.leaveTypeName}</span>
                    <span className="text-sm font-semibold text-foreground">{b.remainingDays}일</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 안 읽은 알림 */}
          {notifications.length > 0 && (
            <section className="rounded-xl border border-border bg-background-primary">
              <div className="px-5 pt-5 pb-3">
                <h2 className="text-sm font-medium text-foreground">새 알림</h2>
              </div>
              <ul className="flex flex-col divide-y divide-border">
                {notifications.map((n) => (
                  <li key={n.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-foreground-muted">{n.body}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 퀵 링크 */}
          <section className="rounded-xl border border-border bg-background-primary p-5">
            <h2 className="mb-3 text-sm font-medium text-foreground">빠른 이동</h2>
            <div className="flex flex-wrap gap-2">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* 로그아웃 */}
      <div className="mt-10 border-t border-border pt-6">
        <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
          <Button type="submit" variant="secondary" size="sm">로그아웃</Button>
        </form>
      </div>
    </div>
  );
}
