import { redirect } from "next/navigation";
import { getInviteInfo } from "@teamlet/modules/auth";
import { auth } from "@/auth";
import { AcceptInviteButton } from "@/components/invite/accept-invite-button";
import { AuthLogo } from "@/components/auth/auth-logo";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();

  const result = await getInviteInfo(token);

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-6">
        <AuthLogo />
        <h2 className="text-[22px] font-bold leading-tight tracking-tight">초대 링크 오류</h2>
        <p className="text-sm text-destructive-600">{result.error.message}</p>
        <Link href="/home" className="text-sm text-foreground-muted underline hover:no-underline">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const invite = result.data;

  // 미로그인: 로그인/회원가입 선택지 제공
  if (!session?.user?.id) {
    return (
      <div className="flex flex-col gap-6">
        <AuthLogo />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">
            {invite.companyName}
          </p>
          <h2 className="mt-1 text-[22px] font-bold leading-tight tracking-tight">
            {invite.inviterName}님이 초대했어요
          </h2>
          <p className="mt-1.5 text-[13.5px] text-foreground-muted">
            {invite.employeeName} · {invite.email}
          </p>
        </div>

        <p className="text-sm text-foreground-muted">
          초대를 수락하려면 먼저 계정에 로그인하거나 회원가입해 주세요.
        </p>

        <div className="flex flex-col gap-2">
          <Link
            href={`/login?callbackUrl=/invite/${token}`}
            className="flex h-10 w-full items-center justify-center rounded-md bg-foreground text-sm font-medium text-background hover:opacity-90"
          >
            로그인하고 수락하기
          </Link>
          <Link
            href={`/signup?callbackUrl=/invite/${token}`}
            className="flex h-10 w-full items-center justify-center rounded-md border border-border text-sm text-foreground hover:bg-background-secondary"
          >
            회원가입하고 수락하기
          </Link>
        </div>

        <p className="text-xs text-foreground-subtle text-center">
          초대 만료일: {invite.expiresAt.toLocaleDateString("ko-KR")}
        </p>
      </div>
    );
  }

  // 이미 회사에 소속된 사용자
  if (session.user.employeeId) {
    return (
      <div className="flex flex-col gap-6">
        <AuthLogo />
        <h2 className="text-[22px] font-bold leading-tight tracking-tight">이미 회사에 소속되어 있어요</h2>
        <p className="text-sm text-foreground-muted">
          현재 계정은 이미 다른 직원 레코드에 연결되어 있어요.
        </p>
        <Link href="/home" className="text-sm text-foreground-muted underline hover:no-underline">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  // 로그인됨 + employeeId 없음 → 수락 가능
  return (
    <div className="flex flex-col gap-6">
      <AuthLogo />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">
          {invite.companyName}
        </p>
        <h2 className="mt-1 text-[22px] font-bold leading-tight tracking-tight">
          {invite.inviterName}님이 초대했어요
        </h2>
        <p className="mt-1.5 text-[13.5px] text-foreground-muted">
          {invite.employeeName} · {invite.email}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-background-secondary px-4 py-3">
        <p className="text-sm text-foreground-muted">
          수락하면 <span className="font-medium text-foreground">{invite.companyName}</span>의
          구성원으로 등록돼요.
        </p>
      </div>

      <AcceptInviteButton token={token} />

      <p className="text-xs text-foreground-subtle text-center">
        초대 만료일: {invite.expiresAt.toLocaleDateString("ko-KR")}
      </p>
    </div>
  );
}
