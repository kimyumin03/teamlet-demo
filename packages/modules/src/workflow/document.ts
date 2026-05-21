import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import type { CreateDocumentInput, DocumentListItem, PendingApprovalItem } from "./types";

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
