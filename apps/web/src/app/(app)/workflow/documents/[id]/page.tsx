import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { getDocument } from "@teamlet/modules/workflow";
import type { DocumentDetail } from "@teamlet/modules/workflow";
import { Button } from "@teamlet/ui";
import { auth } from "@/auth";
import { ApproveDocumentButtons } from "@/components/workflow/approve-document-buttons";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<DocumentDetail["kind"], string> = {
  GENERAL: "일반", LEAVE_REQUEST: "휴가", INFO_CHANGE: "정보변경", ANNOUNCEMENT: "공지",
};

const STATUS_LABEL: Record<DocumentDetail["status"], string> = {
  DRAFT: "임시저장", IN_PROGRESS: "진행중", APPROVED: "승인완료", REJECTED: "반려", CANCELLED: "취소",
};

const STATUS_CLASS: Record<DocumentDetail["status"], string> = {
  DRAFT: "bg-background-secondary text-foreground-subtle",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  APPROVED: "bg-background-secondary text-foreground-muted",
  REJECTED: "bg-destructive-50 text-destructive-700",
  CANCELLED: "bg-background-secondary text-foreground-subtle",
};

const LINE_STATUS_ICON: Record<DocumentDetail["approvalLines"][number]["status"], React.ReactNode> = {
  PENDING: <Clock className="size-4 text-amber-500" />,
  APPROVED: <CheckCircle2 className="size-4 text-foreground-muted" />,
  REJECTED: <XCircle className="size-4 text-destructive-600" />,
  SKIPPED: <Clock className="size-4 text-foreground-subtle" />,
};

function formatDateTime(d: Date) {
  return d.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const result = await getDocument(session.user.employeeId, id);
  if (!result.ok) {
    if (result.error.code === "NOT_FOUND") notFound();
    redirect("/workflow");
  }

  const doc = result.data;
  const employeeId = session.user.employeeId;
  const pendingLineForMe = doc.approvalLines.find(
    (l) => l.status === "PENDING" && l.approverId === employeeId,
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/workflow"><ChevronLeft /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{doc.title}</h1>
            <span className={`rounded-md px-2 py-0.5 text-xs ${STATUS_CLASS[doc.status]}`}>
              {STATUS_LABEL[doc.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground-muted">
            {KIND_LABEL[doc.kind]} · {doc.authorName} · {formatDateTime(doc.createdAt)}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_280px]">
        <section>
          <h2 className="mb-3 text-sm font-medium text-foreground-muted">문서 내용</h2>
          <div className="rounded-lg border border-border bg-background-primary p-4">
            {Object.keys(doc.formData).length === 0 ? (
              <p className="text-sm text-foreground-subtle">내용 없음</p>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-foreground">
                {JSON.stringify(doc.formData, null, 2)}
              </pre>
            )}
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div>
            <h2 className="mb-3 text-sm font-medium text-foreground-muted">결재선</h2>
            <ol className="flex flex-col gap-3">
              {doc.approvalLines.map((line) => (
                <li key={line.id} className="flex items-start gap-2">
                  <span className="mt-0.5">{LINE_STATUS_ICON[line.status]}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {line.step}단계 · {line.approverName}
                    </p>
                    {line.approvedAt && (
                      <p className="text-xs text-foreground-muted">{formatDateTime(line.approvedAt)}</p>
                    )}
                    {line.actions.map((a) => (
                      <p key={a.id} className="mt-1 text-xs text-foreground-subtle">
                        {a.action === "APPROVE" ? "승인" : a.action === "REJECT" ? "반려" : a.action}
                        {a.comment && ` — ${a.comment}`}
                      </p>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {doc.status === "IN_PROGRESS" && pendingLineForMe && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
              <p className="mb-2 text-xs font-medium text-amber-700">결재 대기 중</p>
              <ApproveDocumentButtons lineId={pendingLineForMe.id} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
