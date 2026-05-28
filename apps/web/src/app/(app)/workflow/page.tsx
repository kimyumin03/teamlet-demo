import Link from "next/link";
import { redirect } from "next/navigation";
import { listMyDocuments, listPendingApprovals, listFormTemplates, listCcDocuments } from "@teamlet/modules/workflow";
import type { DocumentListItem, PendingApprovalItem, CcDocumentItem, FormDocumentKind } from "@teamlet/modules/workflow";
import { listEmployees } from "@teamlet/modules/employee";
import { auth } from "@/auth";
import { CreateDocumentButton } from "@/components/workflow/create-document-button";
import { ApproveDocumentButtons } from "@/components/workflow/approve-document-buttons";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<FormDocumentKind, string> = {
  GENERAL: "일반",
  LEAVE_REQUEST: "휴가 신청",
  INFO_CHANGE: "정보변경",
  ANNOUNCEMENT: "공지",
};

const KIND_BADGE: Record<FormDocumentKind, string> = {
  GENERAL: "border-border bg-background-secondary text-foreground-muted",
  LEAVE_REQUEST: "border-emerald-300 bg-emerald-50 text-emerald-700",
  INFO_CHANGE: "border-destructive/40 bg-destructive/5 text-destructive",
  ANNOUNCEMENT: "border-border bg-background-secondary text-foreground-muted",
};

const STATUS_LABEL: Record<DocumentListItem["status"], string> = {
  DRAFT: "임시저장",
  IN_PROGRESS: "진행 중",
  APPROVED: "승인",
  REJECTED: "반려",
  CANCELLED: "취소",
};

function daysSince(d: Date) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}

function DocKindBadge({ kind }: { kind: FormDocumentKind }) {
  return (
    <span className={`inline-block rounded-[5px] border px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-wide ${KIND_BADGE[kind]}`}>
      {KIND_LABEL[kind]}
    </span>
  );
}

function WaitBadge({ createdAt, rejected = false }: { createdAt: Date; rejected?: boolean }) {
  if (rejected) {
    return (
      <span className="inline-block rounded-[5px] border border-destructive bg-destructive/5 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-destructive">
        반려
      </span>
    );
  }
  const days = daysSince(createdAt);
  if (days === 0) {
    return (
      <span className="inline-block rounded-[5px] border border-border bg-background-primary px-2.5 py-1 font-mono text-[10.5px] font-semibold text-foreground-muted min-w-[52px] text-center">
        오늘
      </span>
    );
  }
  if (days >= 3) {
    return (
      <span className="inline-block rounded-[5px] border border-destructive bg-destructive/5 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-destructive min-w-[52px] text-center">
        D+{days}
      </span>
    );
  }
  return (
    <span className="inline-block rounded-[5px] border border-amber-400 bg-amber-50 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-amber-600 min-w-[52px] text-center">
      D+{days}
    </span>
  );
}

function ResultBadge({ status }: { status: "승인" | "반려" }) {
  if (status === "승인") {
    return (
      <span className="inline-block rounded-[5px] border border-emerald-400 bg-emerald-50 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-emerald-700 min-w-[52px] text-center">
        승인
      </span>
    );
  }
  return (
    <span className="inline-block rounded-[5px] border border-destructive bg-destructive/5 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-destructive min-w-[52px] text-center">
      반려
    </span>
  );
}

function StepLine({ current, total, rejected = false }: { current: number; total: number; rejected?: boolean }) {
  const steps: { label: string; state: "done" | "now" | "rej" | "pending" }[] = [
    { label: "신청", state: "done" },
    ...Array.from({ length: total }, (_, i) => {
      const step = i + 1;
      const isDone = step < current;
      const isNow = step === current;
      return {
        label: `${step}단계`,
        state: (rejected && isNow ? "rej" : isNow ? "now" : isDone ? "done" : "pending") as "done" | "now" | "rej" | "pending",
      };
    }),
  ];

  return (
    <div className="flex flex-wrap items-center gap-0">
      {steps.map((s, i) => (
        <span key={i} className="flex items-center">
          {i > 0 && <span className="px-1 text-[9px] text-foreground-subtle">›</span>}
          <span
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] ${
              s.state === "now"
                ? "border-primary bg-primary/10 font-bold text-foreground"
                : s.state === "done"
                  ? "border-border bg-background-primary text-foreground-muted"
                  : s.state === "rej"
                    ? "border-destructive bg-destructive/5 font-bold text-destructive"
                    : "border-border bg-background-primary text-foreground-subtle"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                s.state === "now"
                  ? "bg-primary"
                  : s.state === "done"
                    ? "bg-emerald-500"
                    : s.state === "rej"
                      ? "bg-destructive"
                      : "bg-foreground-subtle"
              }`}
            />
            {s.label}
          </span>
        </span>
      ))}
    </div>
  );
}

function SectionDivider({ label, count }: { label: string; count: number }) {
  return (
    <div className="mb-2.5 mt-5 flex items-center gap-2.5 first:mt-0">
      <span className="text-[11.5px] font-semibold uppercase tracking-widest text-foreground-muted">{label}</span>
      <span className="rounded-full bg-background-secondary px-2 py-0.5 font-mono text-[10px] font-bold text-foreground">{count}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

const VALID_TABS = ["pending", "requested", "done"] as const;
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
  const activeTab: TabId = VALID_TABS.includes(tab as TabId) ? (tab as TabId) : "pending";

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

  const inProgressDocs = myDocs.filter((d) => d.status === "IN_PROGRESS");
  const draftDocs = myDocs.filter((d) => d.status === "DRAFT");
  const completedDocs = myDocs.filter((d) => d.status === "APPROVED" || d.status === "REJECTED");

  const now = new Date();
  const completedThisMonth = completedDocs.filter((d) => {
    const dt = new Date(d.createdAt);
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
  });
  const approvedThisMonth = completedThisMonth.filter((d) => d.status === "APPROVED").length;
  const rejectedThisMonth = completedThisMonth.filter((d) => d.status === "REJECTED").length;

  const urgentPending = pending.filter((p) => daysSince(p.createdAt) >= 3);
  const normalPending = pending.filter((p) => daysSince(p.createdAt) < 3);

  const TABS = [
    { id: "pending" as TabId, label: "결재 대기", count: pending.length },
    { id: "requested" as TabId, label: "내가 요청한", count: inProgressDocs.length + draftDocs.length },
    { id: "done" as TabId, label: "완료 · 참조", count: completedDocs.length + ccDocs.length },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="shrink-0 border-b border-border bg-background-primary px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight">워크플로우</h1>
            <p className="mt-0.5 text-[13px] text-foreground-muted">
              결재 대기 {pending.length}건
              {completedThisMonth.length > 0 && ` · 이번 달 완료 ${completedThisMonth.length}건`}
            </p>
          </div>
          <CreateDocumentButton employees={employees} templates={templates} />
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="mx-auto max-w-5xl">

          {/* KPI 카드 */}
          <div className="mb-6 grid grid-cols-4 gap-3">
            <div className={`rounded-[14px] border px-4 py-3 ${pending.length > 0 ? "border-amber-200 bg-amber-50/40" : "border-border bg-background-primary"}`}>
              <p className="text-[12px] text-foreground-muted">결재 대기 (내가 처리)</p>
              <p className={`mt-1 text-[22px] font-bold tabular-nums leading-tight ${pending.length > 0 ? "text-amber-700" : "text-foreground"}`}>
                {pending.length}<small className="ml-1 text-[12px] font-normal text-foreground-muted">건</small>
              </p>
              <p className="mt-0.5 text-[11.5px] text-foreground-subtle">
                {urgentPending.length > 0 ? `마감 임박 ${urgentPending.length} · 일반 ${normalPending.length}` : "모두 처리됐어요"}
              </p>
            </div>
            <div className="rounded-[14px] border border-border bg-background-primary px-4 py-3">
              <p className="text-[12px] text-foreground-muted">내가 요청한 진행 중</p>
              <p className="mt-1 text-[22px] font-bold tabular-nums leading-tight">
                {inProgressDocs.length}<small className="ml-1 text-[12px] font-normal text-foreground-muted">건</small>
              </p>
              <p className="mt-0.5 text-[11.5px] text-foreground-subtle">
                {draftDocs.length > 0 ? `임시저장 ${draftDocs.length}건 포함` : "임시저장 없음"}
              </p>
            </div>
            <div className="rounded-[14px] border border-border bg-background-primary px-4 py-3">
              <p className="text-[12px] text-foreground-muted">이번 달 완료</p>
              <p className="mt-1 text-[22px] font-bold tabular-nums leading-tight">
                {completedThisMonth.length}<small className="ml-1 text-[12px] font-normal text-foreground-muted">건</small>
              </p>
              <p className="mt-0.5 text-[11.5px] text-foreground-subtle">
                {completedThisMonth.length > 0
                  ? `승인 ${approvedThisMonth} · 반려 ${rejectedThisMonth}`
                  : "완료된 문서 없음"}
              </p>
            </div>
            <div className="rounded-[14px] border border-border bg-background-primary px-4 py-3">
              <p className="text-[12px] text-foreground-muted">참조</p>
              <p className="mt-1 text-[22px] font-bold tabular-nums leading-tight">
                {ccDocs.length}<small className="ml-1 text-[12px] font-normal text-foreground-muted">건</small>
              </p>
              <p className="mt-0.5 text-[11.5px] text-foreground-subtle">참조로 수신된 문서</p>
            </div>
          </div>

          {/* 탭 */}
          <nav className="mb-5 flex gap-0 border-b border-border">
            {TABS.map((t) => (
              <Link
                key={t.id}
                href={`/workflow?tab=${t.id}`}
                className={`relative flex items-center gap-1.5 border-b-2 -mb-px px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === t.id
                    ? "border-foreground text-foreground"
                    : "border-transparent text-foreground-muted hover:text-foreground hover:border-border"
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`rounded-full bg-background-secondary px-1.5 font-mono text-[10.5px] font-bold tabular-nums ${
                    activeTab === t.id ? "text-foreground" : "text-foreground-subtle"
                  }`}>
                    {t.count}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* 컨텐츠 */}
          {activeTab === "pending" && (
            <PendingTab pending={pending} urgentPending={urgentPending} normalPending={normalPending} />
          )}
          {activeTab === "requested" && (
            <RequestedTab inProgressDocs={inProgressDocs} draftDocs={draftDocs} />
          )}
          {activeTab === "done" && (
            <DoneTab completedDocs={completedDocs} ccDocs={ccDocs} />
          )}
        </div>
      </div>
    </div>
  );
}

function PendingTab({
  pending,
  urgentPending,
  normalPending,
}: {
  pending: PendingApprovalItem[];
  urgentPending: PendingApprovalItem[];
  normalPending: PendingApprovalItem[];
}) {
  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <p className="text-[14px] font-medium text-foreground">모두 처리했어요</p>
        <p className="text-[12.5px] text-foreground-muted">대기 중인 결재 문서가 없어요.</p>
      </div>
    );
  }

  return (
    <div>
      {urgentPending.length > 0 && (
        <>
          <SectionDivider label="마감 임박" count={urgentPending.length} />
          {urgentPending.map((item) => (
            <PendingDocCard key={item.id} item={item} urgent />
          ))}
        </>
      )}
      {normalPending.length > 0 && (
        <>
          {urgentPending.length > 0 && <SectionDivider label="결재 대기" count={normalPending.length} />}
          {normalPending.map((item) => (
            <PendingDocCard key={item.id} item={item} urgent={false} />
          ))}
        </>
      )}
    </div>
  );
}

function PendingDocCard({ item, urgent }: { item: PendingApprovalItem; urgent: boolean }) {
  return (
    <div
      className={`relative mb-2 grid grid-cols-[120px_1fr_auto_auto] items-center gap-4 rounded-[14px] border border-border bg-background-primary px-5 py-3.5 transition-shadow hover:border-border hover:shadow-sm ${
        urgent ? "" : ""
      }`}
    >
      {urgent && (
        <span className="absolute bottom-3.5 left-[-1px] top-3.5 w-[3px] rounded-r-[3px] bg-destructive" />
      )}
      <div className="flex flex-col gap-1.5">
        <DocKindBadge kind={item.documentKind} />
        <span className="font-mono text-[11px] text-foreground-subtle">
          {formatDate(item.createdAt)} 신청
        </span>
      </div>
      <div>
        <p className="mb-1 text-[14px] font-semibold text-foreground truncate">{item.documentTitle}</p>
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-foreground-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-border bg-background-secondary text-[8.5px] font-semibold text-foreground-muted">
              {item.authorName.slice(-2)}
            </span>
            <b className="font-semibold text-foreground">{item.authorName}</b>
          </span>
          <span className="text-foreground-subtle">·</span>
          <span>{item.step}/{item.totalSteps}단계</span>
        </div>
      </div>
      <StepLine current={item.step} total={item.totalSteps} />
      <div className="flex items-center gap-1.5">
        <WaitBadge createdAt={item.createdAt} />
        <Link
          href={`/workflow/documents/${item.documentId}`}
          className="inline-flex h-7 items-center rounded-[7px] border border-border bg-background-primary px-2.5 text-[12px] text-foreground-muted hover:bg-background-secondary transition-colors"
        >
          상세
        </Link>
        <ApproveDocumentButtons lineId={item.id} />
      </div>
    </div>
  );
}

function RequestedTab({
  inProgressDocs,
  draftDocs,
}: {
  inProgressDocs: DocumentListItem[];
  draftDocs: DocumentListItem[];
}) {
  if (inProgressDocs.length === 0 && draftDocs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <p className="text-[14px] font-medium text-foreground">진행 중인 문서가 없어요</p>
        <p className="text-[12.5px] text-foreground-muted">새 문서를 작성해 보세요.</p>
      </div>
    );
  }

  return (
    <div>
      {inProgressDocs.length > 0 && (
        <>
          <SectionDivider label="결재 진행 중" count={inProgressDocs.length} />
          {inProgressDocs.map((doc) => (
            <MyDocCard key={doc.id} doc={doc} />
          ))}
        </>
      )}
      {draftDocs.length > 0 && (
        <>
          <SectionDivider label="임시저장" count={draftDocs.length} />
          {draftDocs.map((doc) => (
            <MyDocCard key={doc.id} doc={doc} />
          ))}
        </>
      )}
    </div>
  );
}

function MyDocCard({ doc }: { doc: DocumentListItem }) {
  const current = doc.currentStep ?? 0;
  return (
    <Link
      href={`/workflow/documents/${doc.id}`}
      className="mb-2 grid grid-cols-[120px_1fr_auto_auto] items-center gap-4 rounded-[14px] border border-border bg-background-primary px-5 py-3.5 transition-shadow hover:shadow-sm"
    >
      <div className="flex flex-col gap-1.5">
        <DocKindBadge kind={doc.kind} />
        <span className="font-mono text-[11px] text-foreground-subtle">{formatDate(doc.createdAt)}</span>
      </div>
      <div>
        <p className="mb-1 text-[14px] font-semibold text-foreground truncate">{doc.title}</p>
        <p className="text-[12px] text-foreground-muted">
          {doc.status === "DRAFT"
            ? "임시저장됨"
            : current > 0
              ? `${current}/${doc.totalSteps}단계 결재 중`
              : `총 ${doc.totalSteps}단계`}
        </p>
      </div>
      {doc.status === "IN_PROGRESS" && current > 0 ? (
        <StepLine current={current} total={doc.totalSteps} />
      ) : (
        <span />
      )}
      <div className="flex items-center gap-1.5">
        <span className={`inline-block rounded-[5px] border px-2.5 py-1 font-mono text-[10.5px] font-semibold min-w-[52px] text-center ${
          doc.status === "DRAFT"
            ? "border-border bg-background-secondary text-foreground-muted"
            : "border-amber-300 bg-amber-50 text-amber-700"
        }`}>
          {STATUS_LABEL[doc.status]}
        </span>
        <span className="inline-block text-[12px] text-foreground-subtle">→</span>
      </div>
    </Link>
  );
}

function DoneTab({
  completedDocs,
  ccDocs,
}: {
  completedDocs: DocumentListItem[];
  ccDocs: CcDocumentItem[];
}) {
  if (completedDocs.length === 0 && ccDocs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <p className="text-[14px] font-medium text-foreground">완료된 문서가 없어요</p>
        <p className="text-[12.5px] text-foreground-muted">승인 또는 반려된 문서가 여기에 표시돼요.</p>
      </div>
    );
  }

  return (
    <div>
      {completedDocs.length > 0 && (
        <>
          <SectionDivider label="내가 요청한 완료" count={completedDocs.length} />
          {completedDocs.map((doc) => (
            <DoneDocCard key={doc.id} doc={doc} />
          ))}
        </>
      )}
      {ccDocs.length > 0 && (
        <>
          <SectionDivider label="참조" count={ccDocs.length} />
          {ccDocs.map((doc) => (
            <CcCard key={doc.id} doc={doc} />
          ))}
        </>
      )}
    </div>
  );
}

function DoneDocCard({ doc }: { doc: DocumentListItem }) {
  const rejected = doc.status === "REJECTED";
  const stepCurrent = rejected
    ? (doc.currentStep ?? doc.totalSteps)
    : doc.totalSteps + 1;
  return (
    <Link
      href={`/workflow/documents/${doc.id}`}
      className="mb-2 grid grid-cols-[120px_1fr_auto_auto] items-center gap-4 rounded-[14px] border border-border bg-background-primary px-5 py-3.5 transition-shadow hover:shadow-sm"
    >
      <div className="flex flex-col gap-1.5">
        <DocKindBadge kind={doc.kind} />
        <span className="font-mono text-[11px] text-foreground-subtle">{formatDate(doc.createdAt)}</span>
      </div>
      <div>
        <p className="mb-1 text-[14px] font-semibold text-foreground truncate">{doc.title}</p>
        <p className="text-[12px] text-foreground-muted">총 {doc.totalSteps}단계</p>
      </div>
      <StepLine current={stepCurrent} total={doc.totalSteps} rejected={rejected} />
      <div className="flex items-center gap-1.5">
        <ResultBadge status={rejected ? "반려" : "승인"} />
        <span className="inline-block text-[12px] text-foreground-subtle">→</span>
      </div>
    </Link>
  );
}

function CcCard({ doc }: { doc: CcDocumentItem }) {
  return (
    <Link
      href={`/workflow/documents/${doc.id}`}
      className="mb-2 grid grid-cols-[120px_1fr_auto_auto] items-center gap-4 rounded-[14px] border border-border bg-background-primary px-5 py-3.5 transition-shadow hover:shadow-sm"
    >
      <div className="flex flex-col gap-1.5">
        <DocKindBadge kind={doc.kind} />
        <span className="font-mono text-[11px] text-foreground-subtle">{formatDate(doc.createdAt)}</span>
      </div>
      <div>
        <p className="mb-1 text-[14px] font-semibold text-foreground truncate">{doc.title}</p>
        <div className="flex items-center gap-1.5 text-[12px] text-foreground-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-border bg-background-secondary text-[8.5px] font-semibold text-foreground-muted">
              {doc.authorName.slice(-2)}
            </span>
            <b className="font-semibold text-foreground">{doc.authorName}</b>
          </span>
          <span className="text-foreground-subtle">·</span>
          <span>참조</span>
        </div>
      </div>
      <span />
      <div className="flex items-center gap-1.5">
        <span className={`inline-block rounded-[5px] border px-2.5 py-1 font-mono text-[10.5px] font-semibold min-w-[52px] text-center ${
          doc.status === "APPROVED"
            ? "border-emerald-400 bg-emerald-50 text-emerald-700"
            : doc.status === "REJECTED"
              ? "border-destructive bg-destructive/5 text-destructive"
              : "border-amber-300 bg-amber-50 text-amber-700"
        }`}>
          {STATUS_LABEL[doc.status]}
        </span>
        <span className="inline-block text-[12px] text-foreground-subtle">→</span>
      </div>
    </Link>
  );
}
