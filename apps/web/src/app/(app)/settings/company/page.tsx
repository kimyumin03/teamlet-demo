import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCompanyInfo } from "@teamlet/modules/tenancy";
import { CompanyInfoForm } from "@/components/company/company-info-form";

export const dynamic = "force-dynamic";

export default async function CompanySettingsPage() {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");

  const result = await getCompanyInfo(session.user.employeeId);
  if (!result.ok) redirect("/home");

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">회사 정보</h1>
        <p className="mt-0.5 text-sm text-foreground-muted">회사 기본 정보와 가입 설정을 관리해요</p>
      </div>
      <CompanyInfoForm initialInfo={result.data} />
    </div>
  );
}
