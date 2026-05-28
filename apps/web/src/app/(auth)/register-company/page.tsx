import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthCard, AuthTitle } from "@/components/teamlet/auth-card";
import { RegisterCompanyForm } from "@/components/forms/register-company-form";

export default async function RegisterCompanyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <AuthCard wide>
      <AuthTitle
        title="회사 등록 신청"
        sub="신청 후 영업일 기준 1일 이내 검토 결과를 메일로 알려드려요."
      />
      <RegisterCompanyForm />
    </AuthCard>
  );
}
