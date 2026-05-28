import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getMembershipSummary } from "@teamlet/modules/tenancy";
import { AuthLogo } from "@/components/auth/auth-logo";
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
      <div className="flex flex-col gap-6">
        <AuthLogo />

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive-50 text-2xl">
            ✕
          </div>

          <div>
            <h2 className="text-[22px] font-bold leading-tight tracking-tight">신청이 반려되었어요</h2>
            <p className="mt-1.5 text-[13.5px] text-foreground-muted">
              아래 사유를 확인하고 다시 신청해주세요
            </p>
          </div>

          {summary.rejected.reviewMemo && (
            <div className="w-full rounded-[10px] border border-destructive-50 bg-destructive-50 px-4 py-3 text-left">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-destructive-600">
                반려 사유
              </p>
              <p className="text-[13px] leading-relaxed text-foreground">
                {summary.rejected.reviewMemo}
              </p>
            </div>
          )}

          <div className="flex w-full gap-2">
            <Link
              href="/join-company"
              replace
              className="flex flex-1 items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-background-secondary transition-colors"
            >
              다시 선택하기
            </Link>
            <Link
              href="/register-company"
              className="flex flex-1 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-colors"
            >
              재신청 →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 대기 상태
  return (
    <div className="flex flex-col gap-6">
      <AuthLogo />
      <ApprovalPoller />

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex size-16 items-center justify-center rounded-full bg-amber-50 text-2xl">
          <span className="absolute inset-0 animate-ping rounded-full bg-amber-100 opacity-60" />
          <span className="relative">⏱</span>
        </div>

        <div>
          <h2 className="text-[22px] font-bold leading-tight tracking-tight">승인을 기다리는 중이에요</h2>
          <p className="mt-1.5 text-[13.5px] text-foreground-muted">
            평균 검토 시간 <strong className="font-semibold text-foreground">4시간</strong> 이내
          </p>
        </div>

        <div className="w-full rounded-[10px] bg-background-secondary px-4 py-3 text-left">
          <div className="flex items-center gap-2.5 py-1.5">
            <div className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">✓</div>
            <span className="flex-1 text-[13px] font-semibold">회사 등록 신청 완료</span>
            <span className="font-mono text-[11px] text-foreground-muted">완료</span>
          </div>
          <div className="flex items-center gap-2.5 py-1.5">
            <div className="flex size-5 animate-pulse items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white">…</div>
            <span className="flex-1 text-[13px] font-semibold">플랫폼 관리자 검토 중</span>
            <span className="font-mono text-[11px] text-foreground-muted">진행</span>
          </div>
          <div className="flex items-center gap-2.5 py-1.5">
            <div className="flex size-5 items-center justify-center rounded-full border-2 border-border text-[10px] font-bold text-foreground-subtle">3</div>
            <span className="flex-1 text-[13px] text-foreground-muted">승인 → 자동 이동</span>
            <span className="font-mono text-[11px] text-foreground-subtle">대기</span>
          </div>
        </div>

        <p className="font-mono text-[11.5px] text-foreground-muted">
          5초마다 자동 새로고침 · 결과는 메일로도 알림드려요
        </p>

        <form action={logoutAction} className="w-full">
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm text-foreground-muted hover:bg-background-secondary transition-colors"
          >
            로그아웃하기
          </button>
        </form>
      </div>
    </div>
  );
}
