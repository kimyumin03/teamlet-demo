import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthLogo } from "@/components/auth/auth-logo";
import { RegisterCompanyForm } from "@/components/forms/register-company-form";

export default async function RegisterCompanyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <AuthLogo />

      <div>
        <h2 className="text-[22px] font-bold leading-tight tracking-tight">회사 등록 신청</h2>
        <p className="mt-1.5 text-[13.5px] text-foreground-muted">
          신청 후 영업일 기준 1일 이내 검토 결과를 메일로 알려드려요.
        </p>
      </div>

      <RegisterCompanyForm />
    </div>
  );
}
