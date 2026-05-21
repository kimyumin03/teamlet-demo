import { listCompanyApplications } from "@teamlet/modules/tenancy";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { ApplicationsClient } from "@/components/admin/applications-client";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  await requirePlatformAdmin();
  const applications = await listCompanyApplications();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">회사 등록 신청</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        회사 등록 신청을 검토하고 승인·반려해요. 승인하면 회사·최고 관리자가
        생성돼요.
      </p>

      <div className="mt-8">
        <ApplicationsClient applications={applications} />
      </div>
    </div>
  );
}
