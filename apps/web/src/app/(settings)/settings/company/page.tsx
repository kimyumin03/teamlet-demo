import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCompanyInfo } from "@teamlet/modules/tenancy";
import { CompanyInfoForm } from "@/components/company/company-info-form";

export const dynamic = "force-dynamic";

export default async function CompanySettingsPage() {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");

  const result = await getCompanyInfo(session.user.employeeId);
  if (!result.ok) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-[20px] font-bold tracking-tight text-foreground">회사 정보</h1>
        </div>
        <p className="rounded-[14px] border border-border bg-background-secondary px-4 py-3 text-[13px] text-foreground-muted">
          회사 정보를 불러올 수 없어요. 권한이 없거나 소속 회사를 찾을 수 없어요.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">회사 정보</h1>
        <p className="mt-0.5 text-[13px] text-foreground-muted">회사 기본 정보와 가입 설정을 관리해요</p>
      </div>
      <CompanyInfoForm initialInfo={result.data} />
    </div>
  );
}
