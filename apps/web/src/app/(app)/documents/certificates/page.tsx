import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listMyCertificates } from "@teamlet/modules/document";
import { listEmployees } from "@teamlet/modules/employee";
import { IssueCertificateButton } from "@/components/document/issue-certificate-button";

export const dynamic = "force-dynamic";

const TYPE_LABEL = { EMPLOYMENT: "재직증명서", CAREER: "경력증명서" } as const;
const TYPE_CLS = {
  EMPLOYMENT: "border-emerald-300 bg-emerald-50 text-emerald-700",
  CAREER: "border-blue-300 bg-blue-50 text-blue-700",
} as const;

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
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="shrink-0 border-b border-border bg-background-primary px-6 py-5">
        <Link
          href="/documents"
          className="mb-3 inline-flex items-center gap-1 text-[12px] text-foreground-subtle hover:text-foreground transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
            <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 1.06L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z" clipRule="evenodd" />
          </svg>
          문서 보관소
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight">증명서 발급</h1>
            <p className="mt-0.5 text-[13px] text-foreground-muted">재직·경력증명서를 발급하고 인쇄할 수 있어요</p>
          </div>
          <IssueCertificateButton employees={employees} selfEmployeeId={session.user.employeeId} />
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="mx-auto max-w-2xl">
          {certs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <p className="text-[14px] font-medium text-foreground">발급된 증명서가 없어요</p>
              <p className="text-[12.5px] text-foreground-muted">증명서 발급 버튼을 눌러 첫 증명서를 발급해 보세요.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {certs.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between gap-4 rounded-[14px] border border-border bg-background-primary px-5 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`shrink-0 rounded-[5px] border px-1.5 py-0.5 font-mono text-[11px] font-semibold ${TYPE_CLS[cert.type]}`}>
                      {TYPE_LABEL[cert.type]}
                    </span>
                    <span className="text-[13.5px] font-semibold text-foreground">{cert.employeeName}</span>
                    <span className="font-mono text-[11px] text-foreground-subtle">{cert.issueNumber}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-[11px] text-foreground-subtle">
                      {cert.createdAt.toLocaleDateString("ko-KR")}
                    </span>
                    <Link
                      href={`/documents/certificates/${cert.id}`}
                      className="rounded-[8px] border border-border px-3 py-1.5 text-[12px] text-foreground hover:bg-background-secondary transition-colors"
                    >
                      인쇄
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
