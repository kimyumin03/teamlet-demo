import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";

export async function approveDocument(
  actorId: string,
  lineId: string,
  comment?: string,
): Promise<Result<void>> {
  const line = await prisma.approvalLine.findUnique({
    where: { id: lineId },
    select: { id: true, documentId: true, step: true, approverId: true, status: true },
  });
  if (!line) return err(errors.notFound("결재 항목을 찾을 수 없어요"));
  if (line.approverId !== actorId) return err(errors.forbidden("본인 결재 항목만 처리할 수 있어요"));
  if (line.status !== "PENDING") return err(errors.validation("대기 중인 항목만 처리할 수 있어요"));

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
    }
  });

  return ok(undefined);
}

export async function rejectDocument(
  actorId: string,
  lineId: string,
  comment?: string,
): Promise<Result<void>> {
  const line = await prisma.approvalLine.findUnique({
    where: { id: lineId },
    select: { id: true, documentId: true, approverId: true, status: true },
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

  return ok(undefined);
}
