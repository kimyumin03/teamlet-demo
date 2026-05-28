import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getDocument } from "@teamlet/modules/workflow";
import type { DocumentDetail } from "@teamlet/modules/workflow";
import { auth } from "@/auth";
import { ApproveDocumentButtons } from "@/components/workflow/approve-document-buttons";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<DocumentDetail["kind"], string> = {
  GENERAL: "일반",
  LEAVE_REQUEST: "휴가",
  INFO_CHANGE: "정보변경",
  ANNOUNCEMENT: "공지",
};
const KIND_CLS: Record<DocumentDetail["kind"], string> = {
  GENERAL: "border-border bg-background-secondary text-foreground-muted",
  LEAVE_REQUEST: "border-emerald-300 bg-emerald-50 text-emerald-700",
  INFO_CHANGE: "border-destructive bg-destructive-50 text-destructive",
  ANNOUNCEMENT: "border-primary/30 bg-primary/5 text-foreground",
};

const STATUS_LABEL: Record<DocumentDetail["status"], string> = {
  DRAFT: "임시저장",
  IN_PROGRESS: "진행중",
  APPROVED: "승인완료",
  REJECTED: "반려",
  CANCELLED: "취소",
};
const STATUS_CLS: Record<DocumentDetail["status"], string> = {
  DRAFT: "border-border bg-background-secondary text-foreground-subtle",
  IN_PROGRESS: "border-amber-300 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-300 bg-emerald-50 text-emerald-700",
  REJECTED: "border-destructive bg-destructive-50 text-destructive",
  CANCELLED: "border-border bg-background-secondary text-foreground-subtle",
};

type LineStatus = DocumentDetail["approvalLines"][number]["status"];

function ApprovalStepIcon({ status }: { status: LineStatus }) {
  if (status === "APPROVED")
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground">
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 text-background-primary">
          <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
        </svg>
      </span>
    );
  if (status === "REJECTED")
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive">
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 text-white">
          <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
        </svg>
      </span>
    );
  if (status === "PENDING")
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-50">
        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-amber-600">
          <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8.75 4.75a.75.75 0 0 0-1.5 0v3.5c0 .414.336.75.75.75h2.25a.75.75 0 0 0 0-1.5h-1.5v-2.75Z" clipRule="evenodd" />
        </svg>
      </span>
    );
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-border bg-background-secondary">
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 text-foreground-subtle">
        <circle cx="8" cy="8" r="3.5" />
      </svg>
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
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="shrink-0 border-b border-border bg-background-primary px-6 py-5">
        <Link
          href="/workflow"
          className="mb-3 inline-flex items-center gap-1 text-[12px] text-foreground-subtle hover:text-foreground transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
            <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 1.06L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z" clipRule="evenodd" />
          </svg>
          결재 목록
        </Link>

        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`rounded-[5px] border px-2 py-0.5 font-mono text-[11px] font-semibold ${KIND_CLS[doc.kind]}`}>
            {KIND_LABEL[doc.kind]}
          </span>
          <span className={`rounded-[5px] border px-2 py-0.5 font-mono text-[11px] font-semibold ${STATUS_CLS[doc.status]}`}>
            {STATUS_LABEL[doc.status]}
          </span>
        </div>
        <h1 className="text-[22px] font-bold leading-tight tracking-tight">{doc.title}</h1>
        <p className="mt-0.5 text-[13px] text-foreground-muted">
          {doc.authorName} · {formatDateTime(doc.createdAt)}
        </p>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_300px]">

          {/* 문서 내용 */}
          <section>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-foreground-muted">
              문서 내용
            </p>
            <div className="rounded-[14px] border border-border bg-background-primary p-5">
              {Object.keys(doc.formData).length === 0 ? (
                <p className="text-[13px] text-foreground-subtle">내용 없음</p>
              ) : doc.templateFields ? (
                <dl className="flex flex-col gap-4">
                  {doc.templateFields.map((field) => {
                    const val = doc.formData[field.id];
                    if (val === undefined || val === null || val === "") return null;
                    return (
                      <div key={field.id}>
                        <dt className="mb-0.5 text-[11.5px] text-foreground-subtle">{field.label}</dt>
                        <dd className="text-[13px] text-foreground whitespace-pre-wrap">
                          {field.type === "checkbox"
                            ? val === "true" ? "예" : "아니오"
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
                      <dt className="mb-0.5 text-[11.5px] text-foreground-subtle">{k}</dt>
                      <dd className="text-[13px] text-foreground whitespace-pre-wrap">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            {/* 모바일 결재 액션 */}
            {pendingLineForMe && (
              <div className="mt-4 rounded-[14px] border border-amber-200 bg-amber-50/40 p-4 lg:hidden">
                <p className="mb-3 text-[13px] font-semibold text-amber-700">
                  {pendingLineForMe.step}단계 결재 차례입니다
                </p>
                <ApproveDocumentButtons lineId={pendingLineForMe.id} />
              </div>
            )}
          </section>

          {/* 사이드바: 결재선 + 참조 + 데스크톱 액션 */}
          <aside className="flex flex-col gap-5">

            {/* 결재선 */}
            <div>
              <p className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-foreground-muted">
                결재선
              </p>
              <ol className="flex flex-col">
                {doc.approvalLines.map((line, idx) => {
                  const isLast = idx === doc.approvalLines.length - 1;
                  const isPending = line.status === "PENDING";
                  const isApproved = line.status === "APPROVED";
                  const isRejected = line.status === "REJECTED";

                  return (
                    <li key={line.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <ApprovalStepIcon status={line.status} />
                        {!isLast && (
                          <div
                            className={`my-1 w-px flex-1 ${isApproved ? "bg-foreground" : "bg-border"}`}
                            style={{ minHeight: "24px" }}
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pb-5">
                        <div className="mb-0.5 flex items-center gap-1.5">
                          <span className={`text-[13.5px] font-semibold ${
                            isPending ? "text-amber-700" : isRejected ? "text-destructive" : "text-foreground"
                          }`}>
                            {line.approverName}
                          </span>
                          <span className="font-mono text-[11px] text-foreground-subtle">
                            {line.step}단계
                          </span>
                        </div>

                        {isPending && (
                          <p className="text-[12px] text-amber-600">대기 중</p>
                        )}
                        {line.approvedAt && (
                          <p className="font-mono text-[11.5px] text-foreground-subtle">
                            {formatDateTime(line.approvedAt)}
                          </p>
                        )}
                        {line.actions.map((a) => (
                          <div key={a.id} className="mt-1.5">
                            {a.comment && (
                              <p className="rounded-[8px] border border-border bg-background-secondary px-3 py-2 text-[12px] text-foreground-muted">
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
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-foreground-muted">
                  참조
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {doc.ccRecipients.map((c) => (
                    <span
                      key={c.employeeId}
                      className="rounded-full border border-border bg-background-secondary px-2.5 py-0.5 text-[12px] text-foreground-muted"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 데스크톱 결재 액션 */}
            {pendingLineForMe && (
              <div className="hidden rounded-[14px] border border-amber-200 bg-amber-50/40 p-4 lg:block">
                <p className="mb-3 text-[13px] font-semibold text-amber-700">
                  {pendingLineForMe.step}단계 결재 차례입니다
                </p>
                <ApproveDocumentButtons lineId={pendingLineForMe.id} />
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
