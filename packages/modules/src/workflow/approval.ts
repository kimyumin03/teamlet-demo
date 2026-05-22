import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { finalizeLeaveFromApprovedDocument, finalizeLeaveFromRejectedDocument } from "../leave/request";

export async function approveDocument(
  actorId: string,
  lineId: string,
  comment?: string,
): Promise<Result<void>> {
  const line = await prisma.approvalLine.findUnique({
    where: { id: lineId },
    select: { id: true, documentId: true, step: true, approverId: true, status: true, document: { select: { kind: true } } },
  });
  if (!line) return err(errors.notFound("결재 항목을 찾을 수 없어요"));
  if (line.approverId !== actorId) return err(errors.forbidden("본인 결재 항목만 처리할 수 있어요"));
  if (line.status !== "PENDING") return err(errors.validation("대기 중인 항목만 처리할 수 있어요"));

  // 순차 결재 강제 — 이전 단계가 모두 승인돼야 처리 가능
  const priorUnapproved = await prisma.approvalLine.count({
    where: {
      documentId: line.documentId,
      step: { lt: line.step },
      status: { not: "APPROVED" },
    },
  });
  if (priorUnapproved > 0) {
    return err(errors.validation("이전 단계 결재가 완료되지 않았어요"));
  }

  let docApproved = false;
  await prisma.$transaction(async (tx) => {
    await tx.approvalLine.update({
      where: { id: lineId },
      data: { status: "APPROVED", approvedAt: new Date() },
    });

    await tx.approvalAction.create({
      data: { documentId: line.documentId, lineId, actorId, action: "APPROVE", comment },
    });

    const nextLine = await tx.approvalLine.findFirst({
      where: { documentId: line.documentId, step: line.step + 1 },
    });

    if (!nextLine) {
      await tx.formDocument.update({
        where: { id: line.documentId },
        data: { status: "APPROVED" },
      });
      docApproved = true;
    }
  });

  if (docApproved && line.document.kind === "LEAVE_REQUEST") {
    await finalizeLeaveFromApprovedDocument(line.documentId);
  }

  return ok(undefined);
}

export async function rejectDocument(
  actorId: string,
  lineId: string,
  comment?: string,
): Promise<Result<void>> {
  const line = await prisma.approvalLine.findUnique({
    where: { id: lineId },
    select: { id: true, documentId: true, approverId: true, status: true, document: { select: { kind: true } } },
  });
  if (!line) return err(errors.notFound("결재 항목을 찾을 수 없어요"));
  if (line.approverId !== actorId) return err(errors.forbidden("본인 결재 항목만 처리할 수 있어요"));
  if (line.status !== "PENDING") return err(errors.validation("대기 중인 항목만 처리할 수 있어요"));

  await prisma.$transaction([
    prisma.approvalLine.update({
      where: { id: lineId },
      data: { status: "REJECTED" },
    }),
    prisma.approvalAction.create({
      data: { documentId: line.documentId, lineId, actorId, action: "REJECT", comment },
    }),
    prisma.formDocument.update({
      where: { id: line.documentId },
      data: { status: "REJECTED" },
    }),
  ]);

  if (line.document.kind === "LEAVE_REQUEST") {
    await finalizeLeaveFromRejectedDocument(line.documentId);
  }

  return ok(undefined);
}
