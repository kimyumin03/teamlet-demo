import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getMembershipSummary } from "@teamlet/modules/tenancy";
import { ApprovalPoller } from "./_components/approval-poller";

export default async function PendingApprovalPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const logoutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  const summary = await getMembershipSummary(session.user.id);
  if (summary.active.length > 0) redirect("/home");

  // 반려 상태
  if (summary.rejected) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive-50">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-8 text-destructive-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>

        <div>
          <h1 className="text-xl font-semibold text-foreground">신청이 반려됐어요</h1>
          <p className="mt-1.5 text-sm text-foreground-muted">
            <span className="font-medium">{summary.rejected.companyName}</span> 등록 신청이 반려됐습니다.
          </p>
          {summary.rejected.reviewMemo && (
            <div className="mt-3 rounded-lg border border-border bg-background-secondary px-4 py-3 text-left">
              <p className="text-xs font-medium text-foreground-muted mb-1">반려 사유</p>
              <p className="text-sm text-foreground">{summary.rejected.reviewMemo}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Link
            href="/register-company"
            className="flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            다시 신청하기
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm text-foreground-muted hover:bg-background-secondary transition-colors"
            >
              로그아웃 후 로그인으로
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 대기 상태
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <ApprovalPoller />

      <div className="relative flex size-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="relative size-8 text-primary">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" />
        </svg>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-foreground">승인 검토 중</h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          회사 등록 신청이 접수됐어요.<br />
          관리자가 승인하면 자동으로 홈으로 이동합니다.
        </p>
        <p className="mt-3 text-xs text-foreground-subtle">5초마다 자동으로 확인 중…</p>
      </div>
    </div>
  );
}
