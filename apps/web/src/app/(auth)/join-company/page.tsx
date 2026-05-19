import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMembershipSummary } from "@teamlet/modules/tenancy";
import { JoinCompanyOptions } from "@/components/forms/join-company-options";

export default async function JoinCompanyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const summary = await getMembershipSummary(session.user.id);
  if (summary.active.length > 0) redirect("/home");
  if (summary.pending > 0) redirect("/pending-approval");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">회사 가입</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          가입할 회사를 선택하거나 새 회사를 등록하세요.
        </p>
      </div>
      <JoinCompanyOptions />
    </div>
  );
}
