import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listCompanyDocuments } from "@teamlet/modules/document";
import { hasPermission } from "@teamlet/modules/permission";
import { AddDocumentButton } from "@/components/document/add-document-button";
import { DeleteDocumentButton } from "@/components/document/delete-document-button";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL = { GENERAL: "일반", NOTICE: "공지", POLICY: "정책" } as const;
const CATEGORY_TAG = { GENERAL: "tag", NOTICE: "tag warn", POLICY: "tag wfh" } as const;

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");

  const result = await listCompanyDocuments(session.user.employeeId);
  const docs = result.ok ? result.data : [];
  const canManage = await hasPermission(session.user.employeeId, "document.company_archive.manage");

  return (
    <div className="page-body">
      {/* 헤더 */}
      <div className="page-h">
        <div>
          <h1 className="h-title">문서·증명서</h1>
          <div className="h-sub">공용 문서·공지·정책 자료를 보관하고 증명서를 발급해요</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link href="/documents/certificates" className="btn btn-outline">증명서 발급</Link>
          {canManage && <AddDocumentButton />}
        </div>
      </div>

      <div className="sec-divider">
        문서 목록<span className="ct">{docs.length}</span><span className="line" />
      </div>

      {docs.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--fg-muted)" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--fg)", marginBottom: "6px" }}>
            등록된 문서가 없어요
          </div>
          <div style={{ fontSize: "12.5px" }}>
            {canManage ? "문서 추가 버튼을 눌러 첫 자료를 올려보세요." : "등록된 공용 문서가 아직 없어요."}
          </div>
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>분류</th>
              <th>제목</th>
              <th>올린 사람</th>
              <th>등록일</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id}>
                <td><span className={CATEGORY_TAG[doc.category]}>{CATEGORY_LABEL[doc.category]}</span></td>
                <td>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontWeight: 600, color: "var(--fg)", textDecoration: "none" }}
                  >
                    {doc.title}
                  </a>
                </td>
                <td><span className="sn">{doc.uploaderName}</span></td>
                <td><span className="sn">{doc.createdAt.toLocaleDateString("ko-KR")}</span></td>
                <td style={{ textAlign: "right" }}>
                  {canManage && <DeleteDocumentButton documentId={doc.id} title={doc.title} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
