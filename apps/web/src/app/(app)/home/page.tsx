import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getMembershipSummary } from "@teamlet/modules/tenancy";
import { Button } from "@teamlet/ui";

/**
 * 홈 — Phase 1 은 멤버십 라우팅 + 플레이스홀더.
 * 실제 홈 피드(결재/할일/캘린더)는 Phase 2 (docs/06 §2.1).
 */
export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const summary = await getMembershipSummary(session.user.id);
  if (summary.active.length === 0) {
    redirect(summary.pending > 0 ? "/pending-approval" : "/join-company");
  }

  return (
    <div className="mx-auto flex max-w-[600px] flex-col items-start gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold text-foreground">
        환영해요, {session.user.name}님
      </h1>
      <p className="text-sm text-foreground-muted">
        활성 회사 {summary.active.length}곳에 소속되어 있어요.
      </p>
      <nav className="flex flex-wrap gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link href="/members">구성원</Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link href="/leave">휴가</Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link href="/workflow">워크플로우</Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link href="/recruit">채용</Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link href="/documents">문서 보관소</Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link href="/settings/security">보안 설정</Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link href="/audit-log">감사 로그</Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link href="/settings/permissions">권한 설정</Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link href="/settings/leave-policies">휴가 정책</Link>
        </Button>
      </nav>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <Button type="submit" variant="secondary" size="sm">
          로그아웃
        </Button>
      </form>
    </div>
  );
}
