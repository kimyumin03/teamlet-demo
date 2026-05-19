import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterCompanyForm } from "@/components/forms/register-company-form";

export default async function RegisterCompanyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          회사 등록 신청
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          관리자 검토 후 승인되면 회사가 생성돼요.
        </p>
      </div>
      <RegisterCompanyForm />
    </div>
  );
}
