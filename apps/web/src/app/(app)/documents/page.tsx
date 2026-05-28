import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listCompanyDocuments } from "@teamlet/modules/document";
import { AddDocumentButton } from "@/components/document/add-document-button";
import { DeleteDocumentButton } from "@/components/document/delete-document-button";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL = { GENERAL: "일반", NOTICE: "공지", POLICY: "정책" } as const;
const CATEGORY_CLS = {
  GENERAL: "border-border bg-background-secondary text-foreground-muted",
  NOTICE: "border-amber-300 bg-amber-50 text-amber-700",
  POLICY: "border-blue-300 bg-blue-50 text-blue-700",
} as const;

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");

  const result = await listCompanyDocuments(session.user.employeeId);
  const docs = result.ok ? result.data : [];

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="shrink-0 border-b border-border bg-background-primary px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight">문서 보관소</h1>
            <p className="mt-0.5 text-[13px] text-foreground-muted">공용 문서·공지·정책 자료를 보관해요</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/documents/certificates"
              className="rounded-[8px] border border-border px-3 py-1.5 text-[13px] text-foreground hover:bg-background-secondary transition-colors"
            >
              증명서 발급
            </Link>
            <AddDocumentButton />
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="mx-auto max-w-3xl">
          {docs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <p className="text-[14px] font-medium text-foreground">등록된 문서가 없어요</p>
              <p className="text-[12.5px] text-foreground-muted">문서 추가 버튼을 눌러 첫 자료를 올려보세요.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-4 rounded-[14px] border border-border bg-background-primary px-5 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`shrink-0 rounded-[5px] border px-1.5 py-0.5 font-mono text-[11px] font-semibold ${CATEGORY_CLS[doc.category]}`}>
                      {CATEGORY_LABEL[doc.category]}
                    </span>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-[13.5px] font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {doc.title}
                    </a>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[12px] text-foreground-subtle">{doc.uploaderName}</span>
                    <span className="font-mono text-[11px] text-foreground-subtle">
                      {doc.createdAt.toLocaleDateString("ko-KR")}
                    </span>
                    <DeleteDocumentButton documentId={doc.id} title={doc.title} />
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
