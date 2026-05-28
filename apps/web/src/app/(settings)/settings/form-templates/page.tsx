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
        <h1 className="h-title">양식 관리</h1>
        <p className="h-sub">결재·신청 양식을 만들고 필드를 정의해요</p>
      </div>
      <div className="rounded-[14px] border border-border bg-background-primary px-[26px] py-[22px]">
        <h3 className="mb-1.5 text-[15px] font-bold text-foreground">양식 목록</h3>
        <p className="mb-5 text-[12.5px] text-foreground-muted">기안 시 사용할 양식 템플릿을 정의해요. 양식을 비활성화하면 새 문서에서 선택할 수 없어요.</p>
        <FormTemplatesClient initialTemplates={templates} />
      </div>
    </div>
  );
}
