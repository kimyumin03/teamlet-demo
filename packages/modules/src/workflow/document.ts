import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import type { CreateDocumentInput, DocumentListItem, PendingApprovalItem, DocumentDetail } from "./types";
import type { FieldDef } from "./template";

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
    },
  });

  if (!doc) return err(errors.notFound("문서를 찾을 수 없어요"));

  const isRelated =
    doc.authorId === employeeId ||
    doc.approvalLines.some((l) => l.approverId === employeeId);
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
  if (input.approverIds.length === 0)
    return err(errors.validation("결재자를 한 명 이상 지정해야 해요"));

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

    await tx.approvalLine.createMany({
      data: input.approverIds.map((approverId, idx) => ({
        documentId: created.id,
        step: idx + 1,
        approverId,
        status: idx === 0 ? "PENDING" : "PENDING",
      })),
    });

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

export async function listPendingApprovals(
  employeeId: string,
): Promise<Result<PendingApprovalItem[]>> {
  const lines = await prisma.approvalLine.findMany({
    where: { approverId: employeeId, status: "PENDING" },
    include: {
      document: {
        include: { author: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const items = await Promise.all(
    lines.map(async (line) => {
      const totalSteps = await prisma.approvalLine.count({
        where: { documentId: line.documentId },
      });
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

  return ok(items);
}
