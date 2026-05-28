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

const KIND_CSS: Record<FormDocumentKind, string> = {
  GENERAL: "",
  LEAVE_REQUEST: "leave",
  INFO_CHANGE: "hr",
  ANNOUNCEMENT: "",
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
  return <span className={`k ${KIND_CSS[kind]}`}>{KIND_LABEL[kind]}</span>;
}

function WaitBadge({ createdAt, rejected = false }: { createdAt: Date; rejected?: boolean }) {
  if (rejected) return <span className="doc-due rej">반려</span>;
  const days = daysSince(createdAt);
  if (days === 0) return <span className="doc-due">오늘</span>;
  if (days >= 3) return <span className="doc-due urg">D+{days}</span>;
  return <span className="doc-due soon">D+{days}</span>;
}

function ResultBadge({ status }: { status: "승인" | "반려" }) {
  return <span className={`doc-due ${status === "승인" ? "ok" : "rej"}`}>{status}</span>;
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
    <div className="aline">
      {steps.map((s, i) => (
        <span key={i} className="flex items-center">
          {i > 0 && <span className="arr">›</span>}
          <span className={`step ${s.state === "pending" ? "" : s.state}`}>{s.label}</span>
        </span>
      ))}
    </div>
  );
}

function SectionDivider({ label, count }: { label: string; count: number }) {
  return (
    <div className="sec-divider">
      <span>{label}</span><span className="ct">{count}</span><span className="line" />
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
    <div className="page-body">
      <div className="page-h">
        <div>
          <h1 className="h-title">워크플로우</h1>
          <div className="h-sub">
            결재 대기 {pending.length}건
            {completedThisMonth.length > 0 && ` · 이번 달 완료 ${completedThisMonth.length}건`}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <CreateDocumentButton employees={employees} templates={templates} />
        </div>
      </div>

      <div className="kpis">
        <div className={`kpi${pending.length > 0 ? " cta" : ""}`}>
          <span className="lbl">결재 대기 (내가 처리)</span>
          <span className="val num">{pending.length}<small>건</small></span>
          <span className="delta">
            {urgentPending.length > 0 ? `마감 임박 ${urgentPending.length} · 일반 ${normalPending.length}` : "모두 처리됐어요"}
          </span>
        </div>
        <div className="kpi">
          <span className="lbl">내가 요청한 진행 중</span>
          <span className="val num">{inProgressDocs.length}<small>건</small></span>
          <span className="delta">{draftDocs.length > 0 ? `임시저장 ${draftDocs.length}건` : "임시저장 없음"}</span>
        </div>
        <div className="kpi">
          <span className="lbl">이번 달 완료</span>
          <span className="val num">{completedThisMonth.length}<small>건</small></span>
          <span className="delta">
            {completedThisMonth.length > 0 ? `승인 ${approvedThisMonth} · 반려 ${rejectedThisMonth}` : "완료된 문서 없음"}
          </span>
        </div>
        <div className="kpi">
          <span className="lbl">참조</span>
          <span className="val num">{ccDocs.length}<small>건</small></span>
          <span className="delta">읽지 않음 포함</span>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <Link key={t.id} href={`/workflow?tab=${t.id}`} className={`tab${activeTab === t.id ? " active" : ""}`}>
            {t.label}
            {t.count > 0 && <span className="count">{t.count}</span>}
          </Link>
        ))}
      </div>

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
    <div className={`doc${urgent ? " urg" : ""}`}>
      <div className="doc-kind">
        <DocKindBadge kind={item.documentKind} />
        <span className="d">{formatDate(item.createdAt)} 신청</span>
      </div>
      <div className="doc-body">
        <div className="t">{item.documentTitle}</div>
        <div className="m">
          <span className="who">
            <span className="av-mini">{item.authorName.slice(-2)}</span>
            <b>{item.authorName}</b>
          </span>
          <span className="sep">·</span>
          <span>{item.step}/{item.totalSteps}단계</span>
        </div>
      </div>
      <StepLine current={item.step} total={item.totalSteps} />
      <div className="doc-actions">
        <WaitBadge createdAt={item.createdAt} />
        <Link href={`/workflow/documents/${item.documentId}`} className="btn btn-outline sm">상세</Link>
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
    <Link href={`/workflow/documents/${doc.id}`} className="doc">
      <div className="doc-kind">
        <DocKindBadge kind={doc.kind} />
        <span className="d">{formatDate(doc.createdAt)}</span>
      </div>
      <div className="doc-body">
        <div className="t">{doc.title}</div>
        <div className="m">
          {doc.status === "DRAFT" ? "임시저장됨" : current > 0 ? `${current}/${doc.totalSteps}단계 결재 중` : `총 ${doc.totalSteps}단계`}
        </div>
      </div>
      {doc.status === "IN_PROGRESS" && current > 0 ? <StepLine current={current} total={doc.totalSteps} /> : <span />}
      <div className="doc-actions">
        <span className={`doc-due${doc.status === "DRAFT" ? "" : " soon"}`}>{STATUS_LABEL[doc.status]}</span>
        <span className="open-arr">→</span>
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
  const stepCurrent = rejected ? (doc.currentStep ?? doc.totalSteps) : doc.totalSteps + 1;
  return (
    <Link href={`/workflow/documents/${doc.id}`} className="doc">
      <div className="doc-kind">
        <DocKindBadge kind={doc.kind} />
        <span className="d">{formatDate(doc.createdAt)}</span>
      </div>
      <div className="doc-body">
        <div className="t">{doc.title}</div>
        <div className="m">총 {doc.totalSteps}단계</div>
      </div>
      <StepLine current={stepCurrent} total={doc.totalSteps} rejected={rejected} />
      <div className="doc-actions">
        <ResultBadge status={rejected ? "반려" : "승인"} />
        <span className="open-arr">→</span>
      </div>
    </Link>
  );
}

function CcCard({ doc }: { doc: CcDocumentItem }) {
  return (
    <Link href={`/workflow/documents/${doc.id}`} className="doc">
      <div className="doc-kind">
        <DocKindBadge kind={doc.kind} />
        <span className="d">{formatDate(doc.createdAt)}</span>
      </div>
      <div className="doc-body">
        <div className="t">{doc.title}</div>
        <div className="m">
          <span className="who">
            <span className="av-mini">{doc.authorName.slice(-2)}</span>
            <b>{doc.authorName}</b>
          </span>
          <span className="sep">·</span>
          <span>참조</span>
        </div>
      </div>
      <span />
      <div className="doc-actions">
        <span className={`doc-due${doc.status === "APPROVED" ? " ok" : doc.status === "REJECTED" ? " rej" : " soon"}`}>
          {STATUS_LABEL[doc.status]}
        </span>
        <span className="open-arr">→</span>
      </div>
    </Link>
  );
}
