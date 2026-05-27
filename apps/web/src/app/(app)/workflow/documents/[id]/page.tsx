import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, CheckCircle2, XCircle, Clock, Circle } from "lucide-react";
import { getDocument } from "@teamlet/modules/workflow";
import type { DocumentDetail } from "@teamlet/modules/workflow";
import { Button } from "@teamlet/ui";
import { auth } from "@/auth";
import { ApproveDocumentButtons } from "@/components/workflow/approve-document-buttons";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<DocumentDetail["kind"], string> = {
  GENERAL: "일반",
  LEAVE_REQUEST: "휴가",
  INFO_CHANGE: "정보변경",
  ANNOUNCEMENT: "공지",
};
const STATUS_LABEL: Record<DocumentDetail["status"], string> = {
  DRAFT: "임시저장",
  IN_PROGRESS: "진행중",
  APPROVED: "승인완료",
  REJECTED: "반려",
  CANCELLED: "취소",
};
const STATUS_CLASS: Record<DocumentDetail["status"], string> = {
  DRAFT: "bg-background-secondary text-foreground-subtle",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  APPROVED: "bg-background-secondary text-foreground-muted",
  REJECTED: "bg-destructive-50 text-destructive-700",
  CANCELLED: "bg-background-secondary text-foreground-subtle",
};

type LineStatus = DocumentDetail["approvalLines"][number]["status"];

function ApprovalStepIcon({ status }: { status: LineStatus }) {
  if (status === "APPROVED")
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground">
        <CheckCircle2 className="h-4 w-4 text-background-primary" />
      </span>
    );
  if (status === "REJECTED")
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive-600">
        <XCircle className="h-4 w-4 text-white" />
      </span>
    );
  if (status === "PENDING")
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-50">
        <Clock className="h-3.5 w-3.5 text-amber-600" />
      </span>
    );
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-border bg-background-secondary">
      <Circle className="h-3 w-3 text-foreground-subtle" />
    </span>
  );
}

function formatDateTime(d: Date) {
  return new Date(d).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* 헤더 */}
      <header className="mb-8 flex items-start gap-3">
        <Button asChild variant="ghost" size="icon" className="mt-0.5 shrink-0">
          <Link href="/workflow">
            <ChevronLeft />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="rounded bg-background-secondary px-2 py-0.5 text-xs text-foreground-subtle">
              {KIND_LABEL[doc.kind]}
            </span>
            <span className={`rounded-md px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[doc.status]}`}>
              {STATUS_LABEL[doc.status]}
            </span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">{doc.title}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {doc.authorName} · {formatDateTime(doc.createdAt)}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
        {/* 문서 내용 */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-foreground-muted">문서 내용</h2>
          <div className="rounded-xl border border-border bg-background-primary p-5">
            {Object.keys(doc.formData).length === 0 ? (
              <p className="text-sm text-foreground-subtle">내용 없음</p>
            ) : doc.templateFields ? (
              <dl className="flex flex-col gap-4">
                {doc.templateFields.map((field) => {
                  const val = doc.formData[field.id];
                  if (val === undefined || val === null || val === "") return null;
                  return (
                    <div key={field.id}>
                      <dt className="mb-0.5 text-xs text-foreground-subtle">{field.label}</dt>
                      <dd className="text-sm text-foreground whitespace-pre-wrap">
                        {field.type === "checkbox"
                          ? val === "true"
                            ? "예"
                            : "아니오"
                          : String(val)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            ) : (
              <dl className="flex flex-col gap-4">
                {Object.entries(doc.formData).map(([k, v]) => (
                  <div key={k}>
                    <dt className="mb-0.5 text-xs text-foreground-subtle">{k}</dt>
                    <dd className="text-sm text-foreground whitespace-pre-wrap">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* 내 결재 액션 (모바일에서는 여기에) */}
          {pendingLineForMe && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/40 p-4 lg:hidden">
              <p className="mb-3 text-sm font-medium text-amber-700">
                {pendingLineForMe.step}단계 결재 차례입니다
              </p>
              <ApproveDocumentButtons lineId={pendingLineForMe.id} />
            </div>
          )}
        </section>

        {/* 결재선 타임라인 */}
        <aside className="flex flex-col gap-4">
          <div>
            <h2 className="mb-4 text-sm font-medium text-foreground-muted">결재선</h2>
            <ol className="flex flex-col">
              {doc.approvalLines.map((line, idx) => {
                const isLast = idx === doc.approvalLines.length - 1;
                const isPending = line.status === "PENDING";
                const isApproved = line.status === "APPROVED";
                const isRejected = line.status === "REJECTED";

                return (
                  <li key={line.id} className="flex gap-3">
                    {/* 타임라인 심볼 + 연결선 */}
                    <div className="flex flex-col items-center">
                      <ApprovalStepIcon status={line.status} />
                      {!isLast && (
                        <div
                          className={`w-px flex-1 my-1 ${
                            isApproved ? "bg-foreground" : "bg-border"
                          }`}
                          style={{ minHeight: "24px" }}
                        />
                      )}
                    </div>

                    {/* 단계 정보 */}
                    <div className={`pb-5 min-w-0 flex-1 ${isLast ? "" : ""}`}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`text-sm font-medium ${
                            isPending
                              ? "text-amber-700"
                              : isRejected
                              ? "text-destructive-700"
                              : "text-foreground"
                          }`}
                        >
                          {line.approverName}
                        </span>
                        <span className="text-xs text-foreground-subtle">
                          {line.step}단계
                        </span>
                      </div>

                      {isPending && (
                        <p className="text-xs text-amber-600">대기 중</p>
                      )}
                      {line.approvedAt && (
                        <p className="text-xs text-foreground-subtle">
                          {formatDateTime(line.approvedAt)}
                        </p>
                      )}
                      {line.actions.map((a) => (
                        <div key={a.id} className="mt-1">
                          {a.comment && (
                            <p className="text-xs text-foreground-muted bg-background-secondary rounded px-2 py-1 mt-1">
                              "{a.comment}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* 참조자 */}
          {doc.ccRecipients.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-foreground-muted">참조</h2>
              <div className="flex flex-wrap gap-1.5">
                {doc.ccRecipients.map((c) => (
                  <span
                    key={c.employeeId}
                    className="rounded-full border border-border bg-background-secondary px-2.5 py-0.5 text-xs text-foreground-muted"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 내 결재 액션 (데스크톱) */}
          {pendingLineForMe && (
            <div className="hidden lg:block rounded-xl border border-amber-200 bg-amber-50/40 p-4">
              <p className="mb-3 text-sm font-medium text-amber-700">
                {pendingLineForMe.step}단계 결재 차례입니다
              </p>
              <ApproveDocumentButtons lineId={pendingLineForMe.id} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
