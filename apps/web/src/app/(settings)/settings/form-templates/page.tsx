import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listFormTemplates } from "@teamlet/modules/workflow";
import { FormTemplatesClient } from "@/components/form-template/form-templates-client";

export const dynamic = "force-dynamic";

export default async function FormTemplatesPage() {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");

  const result = await listFormTemplates(session.user.employeeId);
  const templates = result.ok ? result.data : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">양식 관리</h1>
        <p className="mt-0.5 text-sm text-foreground-muted">결재·신청 양식을 만들고 필드를 정의해요</p>
      </div>
      <FormTemplatesClient initialTemplates={templates} />
    </div>
  );
}
