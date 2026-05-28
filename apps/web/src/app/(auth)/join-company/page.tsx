import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getMembershipSummary } from "@teamlet/modules/tenancy";
import { AuthCard, AuthTitle } from "@/components/teamlet/auth-card";
import { JoinCompanyOptions } from "@/components/forms/join-company-options";

export default async function JoinCompanyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const summary = await getMembershipSummary(session.user.id);
  if (summary.active.length > 0) redirect("/home");
  if (summary.pending > 0) redirect("/pending-approval");

  const name = session.user.name?.split(" ")[0] ?? "";

  return (
    <AuthCard wide>
      <AuthTitle
        title="회사를 선택해주세요"
        sub={`${name ? `${name}님, ` : ""}어떻게 Teamlet을 시작할까요?`}
      />
      <JoinCompanyOptions
        logoutAction={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      />
    </AuthCard>
  );
}
