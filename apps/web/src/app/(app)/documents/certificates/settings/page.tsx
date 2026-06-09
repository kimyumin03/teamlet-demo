import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { listCertificateTemplates } from "@teamlet/modules/document";
import { hasPermission } from "@teamlet/modules/permission";
import { CertificateTemplateManager } from "./_components/certificate-template-manager";

export const dynamic = "force-dynamic";

export default async function CertificateSettingsPage() {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");
  const employeeId = session.user.employeeId;

  const canManage = await hasPermission(employeeId, "document.certificate.manage");
  if (!canManage) notFound();

  const result = await listCertificateTemplates(employeeId);
  const templates = result.ok ? result.data : [];

  return (
    <div className="page-body">
      <Link
        href="/documents/certificates"
        style={{
          display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 10,
          fontSize: "12px", color: "var(--fg-subtle)", textDecoration: "none",
        }}
      >
        ← 증명서 발급
      </Link>

      <div className="page-h">
        <div>
          <h1 className="h-title">증명서 종류 설정</h1>
          <div className="h-sub">직원이 발급할 수 있는 증명서 종류를 등록·관리해요</div>
        </div>
      </div>

      <CertificateTemplateManager templates={templates} />
    </div>
  );
}
