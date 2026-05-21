import { redirect } from "next/navigation";
import { FileText, Inbox } from "lucide-react";
import { listMyDocuments, listPendingApprovals } from "@teamlet/modules/workflow";
import type { DocumentListItem, PendingApprovalItem } from "@teamlet/modules/workflow";
import { EmptyState } from "@teamlet/ui";
import { listEmployees } from "@teamlet/modules/employee";
import { auth } from "@/auth";
import { CreateDocumentButton } from "@/components/workflow/create-document-button";
import { ApproveDocumentButtons } from "@/components/workflow/approve-document-buttons";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<DocumentListItem["kind"], string> = {
  GENERAL: "일반",
  LEAVE_REQUEST: "휴가",
  INFO_CHANGE: "정보변경",
  ANNOUNCEMENT: "공지",
};

const STATUS_LABEL: Record<DocumentListItem["status"], string> = {
  DRAFT: "임시저장",
  IN_PROGRESS: "진행중",
  APPROVED: "승인",
  REJECTED: "반려",
  CANCELLED: "취소",
};

const STATUS_CLASS: Record<DocumentListItem["status"], string> = {
  DRAFT: "bg-background-secondary text-foreground-subtle",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  APPROVED: "bg-background-secondary text-foreground-muted",
  REJECTED: "bg-destructive-50 text-destructive-700",
  CANCELLED: "bg-background-secondary text-foreground-subtle",
};

function formatDate(d: Date) {
  return d.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

export default async function WorkflowPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const employeeId = session.user.employeeId;

  const [myDocsResult, pendingResult, employeesResult] = await Promise.all([
    listMyDocuments(employeeId),
    listPendingApprovals(employeeId),
    listEmployees(employeeId),
  ]);

  const myDocs = myDocsResult.ok ? myDocsResult.data : [];
  const pending = pendingResult.ok ? pendingResult.data : [];
  const employees = employeesResult.ok
    ? employeesResult.data.filter((e) => e.id !== employeeId && e.employmentStatus === "ACTIVE")
    : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">워크플로우</h1>
          <p className="mt-1 text-sm text-foreground-muted">결재 문서 관리</p>
        </div>
        <CreateDocumentButton employees={employees} />
      </header>

      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-medium text-foreground-muted">
            결재 대기 <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">{pending.length}</span>
          </h2>
          <ul className="flex flex-col gap-2">
            {pending.map((item) => (
              <PendingItem key={item.id} item={item} />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium text-foreground-muted">내 문서</h2>
        {myDocs.length === 0 ? (
          <EmptyState
            icon={<FileText />}
            title="작성한 문서가 없어요"
            description="문서 작성 버튼을 눌러 첫 결재를 시작해 보세요."
          />
        ) : (
          <ul className="flex flex-col gap-1">
            {myDocs.map((doc) => (
              <li key={doc.id}>
              <a
                href={`/workflow/documents/${doc.id}`}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 rounded-lg border border-border bg-background-primary px-4 py-3 transition-colors hover:bg-background-secondary"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">{doc.title}</span>
                  <span className="text-sm text-foreground-muted">
                    {KIND_LABEL[doc.kind]} · {formatDate(doc.createdAt)}
                  </span>
                </div>
                <span className="text-sm text-foreground-muted">
                  {doc.currentStep !== null ? `${doc.currentStep}/${doc.totalSteps}단계` : `${doc.totalSteps}단계`}
                </span>
                <span className={`rounded-md px-2 py-0.5 text-xs ${STATUS_CLASS[doc.status]}`}>
                  {STATUS_LABEL[doc.status]}
                </span>
                <div />
              </a>
            </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PendingItem({ item }: { item: PendingApprovalItem }) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{item.documentTitle}</span>
          <span className="rounded bg-background-secondary px-1.5 py-0.5 text-xs text-foreground-muted">
            {KIND_LABEL[item.documentKind]}
          </span>
        </div>
        <span className="text-sm text-foreground-muted">
          {item.authorName} · {item.step}/{item.totalSteps}단계 · {formatDate(item.createdAt)}
        </span>
      </div>
      <ApproveDocumentButtons lineId={item.id} />
    </li>
  );
}
