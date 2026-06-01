import Link from "next/link";
import { redirect } from "next/navigation";
import { listMyDocuments, listPendingApprovals, listFormTemplates, listCcDocuments } from "@teamlet/modules/workflow";
import type { CcDocumentItem, FormDocumentKind } from "@teamlet/modules/workflow";
import { listEmployees } from "@teamlet/modules/employee";
import { listPendingMemberships } from "@teamlet/modules/tenancy";
import { hasPermission } from "@teamlet/modules/permission";
import { auth } from "@/auth";
import { CreateDocumentButton } from "@/components/workflow/create-document-button";
import { WorkflowClient } from "./_components/workflow-client";
import { JoinRequestsPanel } from "./_components/join-requests-panel";

export const dynamic = "force-dynamic";

function daysSince(d: Date) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

export default async function WorkflowPage({
  searchParams,
}: {
  searchParams: Promise<{ box?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const { box = "mine", status = "active" } = await searchParams;
  const employeeId = session.user.employeeId;

  const canManageMembers = await hasPermission(employeeId, "member.directory.manage");

  const [myDocsResult, pendingResult, ccDocsResult, employeesResult, templatesResult, joinRequestsResult] = await Promise.all([
    listMyDocuments(employeeId),
    listPendingApprovals(employeeId),
    listCcDocuments(employeeId),
    listEmployees(employeeId),
    listFormTemplates(employeeId),
    canManageMembers ? listPendingMemberships(employeeId) : Promise.resolve(null),
  ]);

  const myDocs = myDocsResult.ok ? myDocsResult.data : [];
  const pending = pendingResult.ok ? pendingResult.data : [];
  const ccDocs = ccDocsResult.ok ? ccDocsResult.data : [];
  const employees = employeesResult.ok
    ? employeesResult.data.filter((e) => e.id !== employeeId && e.employmentStatus === "ACTIVE")
    : [];
  const templates = templatesResult.ok ? templatesResult.data.filter((t) => t.isActive) : [];
  const joinRequests = joinRequestsResult?.ok ? joinRequestsResult.data : [];

  const urgentPending = pending.filter((p) => daysSince(p.createdAt) >= 3);
  const inProgressDocs = myDocs.filter((d) => d.status === "IN_PROGRESS");
  const draftDocs = myDocs.filter((d) => d.status === "DRAFT");
  const completedDocs = myDocs.filter((d) => ["APPROVED", "REJECTED", "CANCELLED"].includes(d.status));

  const now = new Date();
  const completedThisMonth = completedDocs.filter((d) => {
    const dt = new Date(d.createdAt);
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
  });

  return (
    <div className="page-body">
      {/* 헤더 */}
      <div className="page-h">
        <div>
          <h1 className="h-title">워크플로우</h1>
          <div className="h-sub">
            내 결재 대기 {pending.length}건
            {urgentPending.length > 0 && ` · 마감 임박 ${urgentPending.length}건`}
            {inProgressDocs.length > 0 && ` · 기안 진행 중 ${inProgressDocs.length}건`}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link href="/settings/form-templates" className="btn btn-outline sm">템플릿 관리</Link>
          <CreateDocumentButton employees={employees} templates={templates} />
        </div>
      </div>

      {/* KPI */}
      <div className="kpis">
        <div className={`kpi${pending.length > 0 ? " cta" : ""}`}>
          <span className="lbl">내 결재 대기</span>
          <span className="val num">{pending.length}<small>건</small></span>
          <span className="delta">
            {urgentPending.length > 0 ? `마감 임박 ${urgentPending.length} · 일반 ${pending.length - urgentPending.length}` : "처리할 결재가 없어요"}
          </span>
        </div>
        <div className="kpi">
          <span className="lbl">기안 진행 중</span>
          <span className="val num">{inProgressDocs.length}<small>건</small></span>
          <span className="delta">{draftDocs.length > 0 ? `임시저장 ${draftDocs.length}건` : "결재 대기 중인 문서"}</span>
        </div>
        <div className="kpi">
          <span className="lbl">이번달 처리</span>
          <span className="val num">{completedThisMonth.length}<small>건</small></span>
          <span className="delta">
            {completedThisMonth.length > 0
              ? `승인 ${completedThisMonth.filter(d=>d.status==="APPROVED").length} · 반려 ${completedThisMonth.filter(d=>d.status==="REJECTED").length}`
              : "이번달 처리 없음"}
          </span>
        </div>
        <div className="kpi">
          <span className="lbl">참조함</span>
          <span className="val num">{ccDocs.length}<small>건</small></span>
          <span className="delta">참조자로 지정된 문서</span>
        </div>
      </div>

      {/* 가입 신청 대기 (권한 있는 경우만) */}
      {canManageMembers && joinRequests.length > 0 && (
        <JoinRequestsPanel items={joinRequests} />
      )}

      {/* 클라이언트 — 박스 전환 + 탭 + 필터 + 목록 */}
      <WorkflowClient
        pending={pending}
        myDocs={myDocs}
        ccDocs={ccDocs}
        employees={employees}
        templates={templates}
        initialBox={box === "company" ? "company" : "mine"}
        initialStatus={["active", "done", "all"].includes(status) ? status as "active"|"done"|"all" : "active"}
      />
    </div>
  );
}
