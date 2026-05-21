import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listCompanyDocuments } from "@teamlet/modules/document";
import { AddDocumentButton } from "@/components/document/add-document-button";
import { DeleteDocumentButton } from "@/components/document/delete-document-button";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL = { GENERAL: "일반", NOTICE: "공지", POLICY: "정책" } as const;

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");

  const result = await listCompanyDocuments(session.user.employeeId);
  const docs = result.ok ? result.data : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">회사 문서 보관소</h1>
          <p className="mt-0.5 text-sm text-foreground-muted">공용 문서·공지·정책 자료를 보관해요</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/documents/certificates"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-background-secondary"
          >
            증명서 발급
          </Link>
          <AddDocumentButton />
        </div>
      </div>

      {docs.length === 0 ? (
        <p className="text-sm text-foreground-muted">등록된 문서가 없어요.</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="shrink-0 rounded bg-background-secondary px-1.5 py-0.5 text-xs text-foreground-muted">
                  {CATEGORY_LABEL[doc.category]}
                </span>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm font-medium text-foreground hover:underline"
                >
                  {doc.title}
                </a>
              </div>
              <div className="flex items-center gap-3 pl-4">
                <span className="shrink-0 text-xs text-foreground-subtle">{doc.uploaderName}</span>
                <span className="shrink-0 text-xs text-foreground-subtle">
                  {doc.createdAt.toLocaleDateString("ko-KR")}
                </span>
                <DeleteDocumentButton documentId={doc.id} title={doc.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
