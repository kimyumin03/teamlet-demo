import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listMyCertificates, listCertificateTemplates } from "@teamlet/modules/document";
import { listEmployees } from "@teamlet/modules/employee";
import { hasPermission } from "@teamlet/modules/permission";
import { IssueCertificateButton } from "@/components/document/issue-certificate-button";

export const dynamic = "force-dynamic";

const TYPE_LABEL = { EMPLOYMENT: "재직증명서", CAREER: "경력증명서" } as const;
const TYPE_TAG = { EMPLOYMENT: "tag ok", CAREER: "tag wfh" } as const;

export default async function CertificatesPage() {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");
  const employeeId = session.user.employeeId;

  const canManage = await hasPermission(employeeId, "document.certificate.manage");

  const [certResult, empResult, tplResult] = await Promise.all([
    listMyCertificates(employeeId),
    canManage ? listEmployees(employeeId) : Promise.resolve(null),
    listCertificateTemplates(employeeId),
  ]);

  const certs = certResult.ok ? certResult.data : [];
  const employees = canManage && empResult?.ok
    ? empResult.data
    : [{ id: employeeId, name: session.user.name ?? "나" }];
  const templates = tplResult.ok ? tplResult.data : [];

  return (
    <div className="page-body">
      <Link
        href="/documents"
        style={{
          display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 10,
          fontSize: "12px", color: "var(--fg-subtle)", textDecoration: "none",
        }}
      >
        ← 문서·증명서
      </Link>

      <div className="page-h">
        <div>
          <h1 className="h-title">증명서 발급</h1>
          <div className="h-sub">회사 공용 문서를 발급할 수 있어요</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {canManage && (
            <Link href="/documents/certificates/settings" className="btn btn-outline sm">
              종류 설정
            </Link>
          )}
          <IssueCertificateButton
            employees={employees}
            selfEmployeeId={employeeId}
            templates={templates}
          />
        </div>
      </div>

      {canManage && templates.length === 0 && (
        <div style={{
          margin: "0 0 16px", padding: "12px 16px", borderRadius: 10,
          background: "var(--bg-warn, #fffbeb)", border: "1px solid var(--border-warn, #fde68a)",
          fontSize: "13px", color: "var(--fg-warn, #92400e)",
        }}>
          아직 등록된 증명서 종류가 없어요.{" "}
          <Link href="/documents/certificates/settings" style={{ fontWeight: 600, color: "inherit" }}>
            종류 설정
          </Link>
          에서 먼저 증명서 종류를 추가해주세요.
        </div>
      )}

      <div className="sec-divider">
        발급 이력<span className="ct">{certs.length}</span><span className="line" />
      </div>

      {certs.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--fg-muted)" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--fg)", marginBottom: "6px" }}>
            발급된 증명서가 없어요
          </div>
          <div style={{ fontSize: "12.5px" }}>증명서 발급 버튼을 눌러 첫 증명서를 발급해 보세요.</div>
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>종류</th>
              <th>대상자</th>
              <th>발급번호</th>
              <th>발급일</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {certs.map((cert) => (
              <tr key={cert.id}>
                <td><span className={TYPE_TAG[cert.type]}>{TYPE_LABEL[cert.type]}</span></td>
                <td><span style={{ fontWeight: 600 }}>{cert.employeeName}</span></td>
                <td><span className="sn">{cert.issueNumber}</span></td>
                <td><span className="sn">{cert.createdAt.toLocaleDateString("ko-KR")}</span></td>
                <td style={{ textAlign: "right" }}>
                  {cert.fileUrl ? (
                    <a
                      href={cert.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline sm"
                    >
                      다운로드
                    </a>
                  ) : (
                    <Link href={`/documents/certificates/${cert.id}`} className="btn btn-outline sm">
                      인쇄
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
