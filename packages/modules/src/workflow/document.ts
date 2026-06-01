import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import type { CreateDocumentInput, DocumentListItem, PendingApprovalItem, DocumentDetail, CcDocumentItem } from "./types";
import type { FieldDef } from "./template";
import { resolveApprovalSteps } from "./approval-policy";

export async function getDocument(
  employeeId: string,
  documentId: string,
): Promise<Result<DocumentDetail>> {
  const doc = await prisma.formDocument.findUnique({
    where: { id: documentId },
    include: {
      author: { select: { name: true } },
      template: { select: { fields: true } },
      approvalLines: {
        include: {
          approver: { select: { name: true } },
          actions: {
            include: { actor: { select: { name: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { step: "asc" },
      },
      ccRecipients: { select: { employeeId: true, employee: { select: { name: true } } } },
    },
  });

  if (!doc) return err(errors.notFound("문서를 찾을 수 없어요"));

  const isRelated =
    doc.authorId === employeeId ||
    doc.approvalLines.some((l) => l.approverId === employeeId) ||
    doc.ccRecipients.some((c) => c.employeeId === employeeId);
  if (!isRelated) return err(errors.forbidden("열람 권한이 없어요"));

  return ok({
    id: doc.id,
    title: doc.title,
    kind: doc.kind,
    status: doc.status,
    formData: doc.formData as Record<string, unknown>,
    templateFields: doc.template ? (doc.template.fields as FieldDef[]) : null,
    authorName: doc.author.name,
    createdAt: doc.createdAt,
    ccRecipients: doc.ccRecipients.map((c) => ({ employeeId: c.employeeId, name: c.employee.name })),
    approvalLines: doc.approvalLines.map((l) => ({
      id: l.id,
      step: l.step,
      approverId: l.approverId,
      approverName: l.approver.name,
      status: l.status,
      approvedAt: l.approvedAt,
      actions: l.actions.map((a) => ({
        id: a.id,
        actorName: a.actor.name,
        action: a.action,
        comment: a.comment,
        createdAt: a.createdAt,
      })),
    })),
  });
}

export async function createDocument(
  input: CreateDocumentInput,
): Promise<Result<{ id: string }>> {
  // 결재자 미지정 시 결재 정책으로 자동 배정 (C7). 지정 시엔 그대로 사용(변경 허용).
  let approverIds = input.approverIds;
  if (approverIds.length === 0) {
    const resolved = await resolveApprovalSteps(input.companyId, input.authorId, input.kind);
    if (!resolved.ok) return resolved;
    if (!resolved.data)
      return err(errors.validation("결재자를 지정하거나 해당 문서 종류의 결재 정책을 먼저 설정해 주세요"));
    approverIds = resolved.data;
  }

  if (approverIds.length === 0)
    return err(errors.validation("결재자를 한 명 이상 지정해야 해요"));

  // 결재자 중복 지정 차단
  const uniqueApprovers = new Set(approverIds);
  if (uniqueApprovers.size !== approverIds.length)
    return err(errors.validation("같은 결재자를 중복 지정할 수 없어요"));

  // 결재자가 모두 같은 회사 소속인지 검증 (cross-tenant 방지)
  const approverCount = await prisma.employee.count({
    where: { id: { in: [...uniqueApprovers] }, companyId: input.companyId },
  });
  if (approverCount !== uniqueApprovers.size)
    return err(errors.validation("결재자 중 회사 소속이 아닌 사람이 있어요"));

  // CC 참조자도 같은 회사 소속인지 검증 (cross-tenant 열람권 부여 방지 — H3)
  const uniqueCc = input.ccRecipientIds && input.ccRecipientIds.length > 0
    ? [...new Set(input.ccRecipientIds)]
    : [];
  if (uniqueCc.length > 0) {
    const ccCount = await prisma.employee.count({
      where: { id: { in: uniqueCc }, companyId: input.companyId },
    });
    if (ccCount !== uniqueCc.length)
      return err(errors.validation("참조자 중 회사 소속이 아닌 사람이 있어요"));
  }

  const doc = await prisma.$transaction(async (tx) => {
    const created = await tx.formDocument.create({
      data: {
        companyId: input.companyId,
        authorId: input.authorId,
        templateId: input.templateId ?? null,
        title: input.title,
        kind: input.kind,
        formData: (input.formData ?? {}) as object,
        status: "IN_PROGRESS",
      },
      select: { id: true },
    });

    // 모든 결재선은 PENDING 으로 시작 — 순차 진행은 approveDocument 가 step 순서로 강제
    await tx.approvalLine.createMany({
      data: approverIds.map((approverId, idx) => ({
        documentId: created.id,
        step: idx + 1,
        approverId,
        status: "PENDING",
      })),
    });

    if (uniqueCc.length > 0) {
      await tx.documentCcRecipient.createMany({
        data: uniqueCc.map((employeeId) => ({ documentId: created.id, employeeId })),
        skipDuplicates: true,
      });
    }

    return created;
  });

  return ok(doc);
}

export async function listMyDocuments(
  employeeId: string,
): Promise<Result<DocumentListItem[]>> {
  const docs = await prisma.formDocument.findMany({
    where: { authorId: employeeId },
    include: {
      author: { select: { name: true } },
      approvalLines: { select: { step: true, status: true }, orderBy: { step: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(
    docs.map((d) => {
      const pendingLine = d.approvalLines.find((l) => l.status === "PENDING");
      return {
        id: d.id,
        title: d.title,
        kind: d.kind,
        status: d.status,
        authorName: d.author.name,
        createdAt: d.createdAt,
        currentStep: pendingLine?.step ?? null,
        totalSteps: d.approvalLines.length,
      };
    }),
  );
}

/** HR이 특정 직원이 기안한 워크플로우 문서 목록 조회 (같은 회사 내). */
export async function listEmployeeDocuments(
  actorEmployeeId: string,
  targetEmployeeId: string,
): Promise<Result<DocumentListItem[]>> {
  const actor = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const target = await prisma.employee.findUnique({
    where: { id: targetEmployeeId },
    select: { companyId: true },
  });
  if (!target || target.companyId !== actor.companyId) {
    return err(errors.notFound("직원을 찾을 수 없어요"));
  }

  const docs = await prisma.formDocument.findMany({
    where: { authorId: targetEmployeeId },
    include: {
      author: { select: { name: true } },
      approvalLines: { select: { step: true, status: true }, orderBy: { step: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(
    docs.map((d) => {
      const pendingLine = d.approvalLines.find((l) => l.status === "PENDING");
      return {
        id: d.id,
        title: d.title,
        kind: d.kind,
        status: d.status,
        authorName: d.author.name,
        createdAt: d.createdAt,
        currentStep: pendingLine?.step ?? null,
        totalSteps: d.approvalLines.length,
      };
    }),
  );
}

export async function listApproverCandidates(
  actorEmployeeId: string,
): Promise<Result<{ id: string; name: string }[]>> {
  const actor = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const employees = await prisma.employee.findMany({
    where: { companyId: actor.companyId, isActive: true, id: { not: actorEmployeeId } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return ok(employees);
}

export async function listPendingApprovals(
  employeeId: string,
): Promise<Result<PendingApprovalItem[]>> {
  // 진행 중 문서의 PENDING 결재선만 — 반려/취소된 문서의 죽은 결재선 제외
  const lines = await prisma.approvalLine.findMany({
    where: {
      approverId: employeeId,
      status: "PENDING",
      document: { status: "IN_PROGRESS" },
    },
    include: {
      document: {
        include: { author: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const items = await Promise.all(
    lines.map(async (line) => {
      const [totalSteps, priorUnapproved] = await Promise.all([
        prisma.approvalLine.count({ where: { documentId: line.documentId } }),
        prisma.approvalLine.count({
          where: {
            documentId: line.documentId,
            step: { lt: line.step },
            status: { not: "APPROVED" },
          },
        }),
      ]);
      // 이전 단계 미완료 → 아직 내 결재 차례 아님
      if (priorUnapproved > 0) return null;
      return {
        id: line.id,
        documentId: line.documentId,
        documentTitle: line.document.title,
        documentKind: line.document.kind,
        authorName: line.document.author.name,
        step: line.step,
        totalSteps,
        createdAt: line.createdAt,
      };
    }),
  );

  return ok(items.filter((i): i is PendingApprovalItem => i !== null));
}

export async function listCcDocuments(
  employeeId: string,
): Promise<Result<CcDocumentItem[]>> {
  const rows = await prisma.documentCcRecipient.findMany({
    where: { employeeId },
    include: {
      document: {
        include: {
          author: { select: { name: true } },
          approvalLines: { select: { step: true }, orderBy: { step: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(
    rows.map((r) => ({
      id: r.document.id,
      title: r.document.title,
      kind: r.document.kind,
      status: r.document.status,
      authorName: r.document.author.name,
      createdAt: r.document.createdAt,
      totalSteps: r.document.approvalLines[0]?.step ?? 0,
    })),
  );
}
