import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listMyCertificates } from "@teamlet/modules/document";
import { listEmployees } from "@teamlet/modules/employee";
import { IssueCertificateButton } from "@/components/document/issue-certificate-button";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TYPE_LABEL = { EMPLOYMENT: "재직증명서", CAREER: "경력증명서" } as const;

export default async function CertificatesPage() {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");

  const [certResult, empResult] = await Promise.all([
    listMyCertificates(session.user.employeeId),
    listEmployees(session.user.employeeId),
  ]);

  const certs = certResult.ok ? certResult.data : [];
  const employees = empResult.ok ? empResult.data : [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">증명서 발급</h1>
          <p className="mt-0.5 text-sm text-foreground-muted">재직·경력증명서를 발급하고 인쇄할 수 있어요</p>
        </div>
        <IssueCertificateButton employees={employees} selfEmployeeId={session.user.employeeId} />
      </div>

      {certs.length === 0 ? (
        <p className="text-sm text-foreground-muted">발급된 증명서가 없어요.</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {certs.map((cert) => (
            <div key={cert.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="rounded bg-background-secondary px-1.5 py-0.5 text-xs text-foreground-muted">
                  {TYPE_LABEL[cert.type]}
                </span>
                <span className="text-sm font-medium text-foreground">{cert.employeeName}</span>
                <span className="text-xs text-foreground-subtle">{cert.issueNumber}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-foreground-subtle">
                  {cert.createdAt.toLocaleDateString("ko-KR")}
                </span>
                <Link
                  href={`/documents/certificates/${cert.id}`}
                  className="rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:bg-background-secondary"
                >
                  인쇄
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
