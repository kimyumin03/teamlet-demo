import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { auth, signOut } from "@/auth";
import { getMembershipSummary } from "@teamlet/modules/tenancy";
import { Button } from "@teamlet/ui";

export default async function PendingApprovalPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const summary = await getMembershipSummary(session.user.id);
  if (summary.active.length > 0) redirect("/home");

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Clock className="size-12 text-foreground-subtle" />
      <div>
        <h1 className="text-xl font-semibold text-foreground">검토 대기 중</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          신청이 접수됐어요. 관리자 승인 후 이메일로 알려드릴게요.
        </p>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <Button type="submit" variant="secondary">
          로그아웃
        </Button>
      </form>
    </div>
  );
}
