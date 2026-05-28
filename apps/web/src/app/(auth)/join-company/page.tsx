import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getMembershipSummary } from "@teamlet/modules/tenancy";
import { AuthLogo } from "@/components/auth/auth-logo";
import { JoinCompanyOptions } from "@/components/forms/join-company-options";

export default async function JoinCompanyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const summary = await getMembershipSummary(session.user.id);
  if (summary.active.length > 0) redirect("/home");
  if (summary.pending > 0) redirect("/pending-approval");

  const name = session.user.name?.split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-6">
      <AuthLogo />

      <div>
        <h2 className="text-[22px] font-bold leading-tight tracking-tight">회사를 선택해주세요</h2>
        <p className="mt-1.5 text-[13.5px] text-foreground-muted">
          {name ? `${name}님, ` : ""}어떻게 Teamlet을 시작할까요?
        </p>
      </div>

      <JoinCompanyOptions
        logoutAction={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      />
    </div>
  );
}
