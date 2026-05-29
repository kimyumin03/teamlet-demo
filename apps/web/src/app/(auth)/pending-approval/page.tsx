import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getMembershipSummary } from "@teamlet/modules/tenancy";
import { AuthCard } from "@/components/teamlet/auth-card";
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
      <AuthCard>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--destructive-50)] text-[var(--destructive)] grid place-items-center text-3xl mx-auto mb-4">✕</div>
          <h2 className="text-[22px] font-bold tracking-[-0.015em] mb-1.5">신청이 반려되었어요</h2>
          <p className="text-[13.5px] text-[var(--fg-muted)] mb-5">아래 사유를 확인하고 다시 신청해주세요</p>
          {summary.rejected.reviewMemo && (
            <div className="rounded-[10px] border border-[var(--destructive-50)] bg-[var(--destructive-50)] px-4 py-3 text-left mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--destructive)] mb-1.5">반려 사유</p>
              <p className="text-[13px] leading-relaxed">{summary.rejected.reviewMemo}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Link href="/join-company" replace className="flex flex-1 items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2.5 text-[13px] font-medium hover:bg-[var(--bg-secondary)] transition-colors">
              다시 선택하기
            </Link>
            <Link href="/register-company" className="flex flex-1 items-center justify-center rounded-lg bg-[var(--primary)] text-[color:var(--primary-on)] px-4 py-2.5 text-[13px] font-medium hover:opacity-90 transition-colors">
              재신청 →
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

  // 대기 상태
  return (
    <AuthCard>
      <ApprovalPoller />
      <div className="text-center">
        <div className="relative w-16 h-16 rounded-full bg-[var(--warn-50)] text-[var(--warn)] grid place-items-center text-3xl mx-auto mb-4">
          <span className="absolute inset-0 animate-ping rounded-full bg-[var(--warn-50)] opacity-60" />
          <span className="relative">⏱</span>
        </div>
        <h2 className="text-[22px] font-bold tracking-[-0.015em] mb-1.5">승인을 기다리는 중이에요</h2>
        <p className="text-[13.5px] text-[var(--fg-muted)] mb-5">평균 검토 시간 <b className="text-[var(--fg)] font-semibold">4시간</b> 이내</p>

        <div className="bg-[var(--bg-secondary)] rounded-[10px] px-4 py-3 text-left mb-4">
          {[
            {
              icon: "✓",
              cls: "bg-[var(--success)] text-white",
              label: summary.pendingType === "membership" ? "가입 신청 완료" : "회사 등록 신청 완료",
              when: "완료",
              pulse: false,
            },
            {
              icon: "…",
              cls: "bg-[var(--warn)] text-white animate-pulse",
              label: summary.pendingType === "membership" ? "회사 관리자 검토 중" : "플랫폼 관리자 검토 중",
              when: "진행",
              pulse: true,
            },
            { icon: "3", cls: "border-2 border-[var(--border-strong)] text-[var(--fg-subtle)]", label: "승인 → 자동 이동", when: "대기", pulse: false },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-[20px_1fr_auto] gap-2.5 items-center py-1.5 text-[13px]">
              <span className={`w-5 h-5 rounded-full grid place-items-center font-mono text-[10px] font-bold ${row.cls}`}>{row.icon}</span>
              <span className={`font-semibold${i === 2 ? " text-[var(--fg-muted)]" : ""}`}>{row.label}</span>
              <span className="text-[var(--fg-muted)] font-mono text-[11px]">{row.when}</span>
            </div>
          ))}
        </div>

        <p className="font-mono text-[11.5px] text-[var(--fg-muted)] mb-4">5초마다 자동 새로고침 · 결과는 메일로도 알림드려요</p>

        <form action={logoutAction}>
          <button type="submit" className="w-full flex items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2.5 text-[13px] text-[var(--fg-muted)] hover:bg-[var(--bg-secondary)] transition-colors">
            로그아웃하기
          </button>
        </form>
      </div>
    </AuthCard>
  );
}
