import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listMyCertificates } from "@teamlet/modules/document";
import { listEmployees } from "@teamlet/modules/employee";
import { IssueCertificateButton } from "@/components/document/issue-certificate-button";

export const dynamic = "force-dynamic";

const TYPE_LABEL = { EMPLOYMENT: "재직증명서", CAREER: "경력증명서" } as const;
const TYPE_TAG = { EMPLOYMENT: "tag ok", CAREER: "tag wfh" } as const;

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

      {/* 헤더 */}
      <div className="page-h">
        <div>
          <h1 className="h-title">증명서 발급</h1>
          <div className="h-sub">재직·경력증명서를 발급하고 인쇄할 수 있어요</div>
        </div>
        <IssueCertificateButton employees={employees} selfEmployeeId={session.user.employeeId} />
      </div>

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
                  <Link href={`/documents/certificates/${cert.id}`} className="btn btn-outline sm">
                    인쇄
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
