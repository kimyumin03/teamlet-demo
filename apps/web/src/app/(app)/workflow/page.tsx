import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { listMyDocuments, listPendingApprovals, listFormTemplates, listCcDocuments } from "@teamlet/modules/workflow";
import type { DocumentListItem, PendingApprovalItem, CcDocumentItem } from "@teamlet/modules/workflow";
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
  return new Date(d).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

const VALID_TABS = ["inbox", "sent", "cc", "draft", "all"] as const;
type TabId = (typeof VALID_TABS)[number];

export default async function WorkflowPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const { tab } = await searchParams;
  const activeTab: TabId = VALID_TABS.includes(tab as TabId) ? (tab as TabId) : "inbox";

  const employeeId = session.user.employeeId;

  const [myDocsResult, pendingResult, ccDocsResult, employeesResult, templatesResult] = await Promise.all([
    listMyDocuments(employeeId),
    listPendingApprovals(employeeId),
    listCcDocuments(employeeId),
    listEmployees(employeeId),
    listFormTemplates(employeeId),
  ]);

  const myDocs = myDocsResult.ok ? myDocsResult.data : [];
  const pending = pendingResult.ok ? pendingResult.data : [];
  const ccDocs = ccDocsResult.ok ? ccDocsResult.data : [];
  const employees = employeesResult.ok
    ? employeesResult.data.filter((e) => e.id !== employeeId && e.employmentStatus === "ACTIVE")
    : [];
  const templates = templatesResult.ok ? templatesResult.data.filter((t) => t.isActive) : [];

  const sentDocs = myDocs.filter((d) => d.status === "IN_PROGRESS");
  const draftDocs = myDocs.filter((d) => d.status === "DRAFT");

  const TABS = [
    { id: "inbox" as TabId, label: "받은결재함", count: pending.length },
    { id: "sent" as TabId, label: "보낸결재함", count: sentDocs.length },
    { id: "cc" as TabId, label: "참조함", count: ccDocs.length },
    { id: "draft" as TabId, label: "임시저장", count: draftDocs.length },
    { id: "all" as TabId, label: "전체 문서", count: myDocs.length },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* 헤더 */}
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">워크플로우</h1>
          <p className="mt-1 text-sm text-foreground-muted">결재 문서를 작성하고 승인해요.</p>
        </div>
        <CreateDocumentButton employees={employees} templates={templates} />
      </header>

      {/* 탭 */}
      <nav className="flex gap-1 border-b border-border mb-6">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/workflow?tab=${t.id}`}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.id
                ? "border-foreground text-foreground"
                : "border-transparent text-foreground-muted hover:text-foreground hover:border-border"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span
                className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                  t.id === "inbox" && t.count > 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-background-secondary text-foreground-subtle"
                }`}
              >
                {t.count}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* 받은결재함 */}
      {activeTab === "inbox" && (
        <InboxTab pending={pending} />
      )}

      {/* 보낸결재함 */}
      {activeTab === "sent" && (
        <DocList docs={sentDocs} emptyText="진행 중인 문서가 없어요." />
      )}

      {/* 참조함 */}
      {activeTab === "cc" && (
        <CcDocList docs={ccDocs} />
      )}

      {/* 임시저장 */}
      {activeTab === "draft" && (
        <DocList docs={draftDocs} emptyText="임시 저장된 문서가 없어요." />
      )}

      {/* 전체 문서 */}
      {activeTab === "all" && (
        <DocList docs={myDocs} emptyText="작성한 문서가 없어요." />
      )}
    </div>
  );
}

function InboxTab({ pending }: { pending: PendingApprovalItem[] }) {
  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background-secondary">
          <FileText className="h-5 w-5 text-foreground-subtle" />
        </div>
        <p className="text-sm text-foreground-muted">승인 대기 문서가 없어요.</p>
        <p className="text-xs text-foreground-subtle">모든 결재가 처리됐어요.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {pending.map((item) => (
        <li key={item.id} className="flex items-center rounded-xl border border-amber-200 bg-amber-50/30 overflow-hidden">
          <Link
            href={`/workflow/documents/${item.documentId}`}
            className="flex min-w-0 flex-1 items-start gap-4 px-5 py-4 hover:bg-amber-50/50 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                  승인 필요
                </span>
                <span className="rounded bg-background-secondary px-1.5 py-0.5 text-[10px] text-foreground-subtle">
                  {item.step}/{item.totalSteps}단계
                </span>
              </div>
              <p className="truncate text-sm font-medium text-foreground">{item.documentTitle}</p>
              <p className="mt-0.5 text-xs text-foreground-muted">
                {item.authorName} 기안 · {formatDate(item.createdAt)}
              </p>
            </div>
          </Link>
          <div className="shrink-0 px-4">
            <ApproveDocumentButtons lineId={item.id} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function CcDocList({ docs }: { docs: CcDocumentItem[] }) {
  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background-secondary">
          <FileText className="h-5 w-5 text-foreground-subtle" />
        </div>
        <p className="text-sm text-foreground-muted">참조로 수신된 문서가 없어요.</p>
        <p className="text-xs text-foreground-subtle">문서 기안 시 참조자로 지정되면 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {docs.map((doc) => (
        <li key={doc.id}>
          <Link
            href={`/workflow/documents/${doc.id}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background-primary px-5 py-4 hover:bg-background-secondary transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded bg-background-secondary px-1.5 py-0.5 text-[10px] text-foreground-subtle">
                  {KIND_LABEL[doc.kind]}
                </span>
                <span className="rounded bg-background-secondary px-1.5 py-0.5 text-[10px] text-foreground-subtle">
                  참조
                </span>
              </div>
              <p className="truncate text-sm font-medium text-foreground">{doc.title}</p>
              <p className="mt-0.5 text-xs text-foreground-muted">
                {doc.authorName} 기안 · {formatDate(doc.createdAt)} · 총 {doc.totalSteps}단계
              </p>
            </div>
            <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[doc.status]}`}>
              {STATUS_LABEL[doc.status]}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function DocList({ docs, emptyText }: { docs: DocumentListItem[]; emptyText: string }) {
  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background-secondary">
          <FileText className="h-5 w-5 text-foreground-subtle" />
        </div>
        <p className="text-sm text-foreground-muted">{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {docs.map((doc) => (
        <li key={doc.id}>
          <Link
            href={`/workflow/documents/${doc.id}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background-primary px-5 py-4 hover:bg-background-secondary transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded bg-background-secondary px-1.5 py-0.5 text-[10px] text-foreground-subtle">
                  {KIND_LABEL[doc.kind]}
                </span>
                {doc.currentStep !== null && (
                  <span className="text-[10px] text-foreground-subtle">
                    {doc.currentStep}/{doc.totalSteps}단계
                  </span>
                )}
              </div>
              <p className="truncate text-sm font-medium text-foreground">{doc.title}</p>
              <p className="mt-0.5 text-xs text-foreground-muted">{formatDate(doc.createdAt)}</p>
            </div>
            <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[doc.status]}`}>
              {STATUS_LABEL[doc.status]}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
