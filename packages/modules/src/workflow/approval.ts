import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { finalizeLeaveFromApprovedDocument, finalizeLeaveFromRejectedDocument } from "../leave/request";
import { finalizeLeavePlanFromDocument } from "../leave/promotion";
import { createNotification } from "../notification/index";

/** 결재 문서 알림 공통 데이터 */
async function loadDocNotifCtx(documentId: string) {
  return prisma.formDocument.findUnique({
    where: { id: documentId },
    select: {
      companyId: true,
      authorId: true,
      title: true,
      kind: true,
      ccRecipients: { select: { employeeId: true } },
    },
  });
}

/** CC 참조자 전원에게 알림 발송 (실패 무시) */
async function notifyCc(
  ctx: NonNullable<Awaited<ReturnType<typeof loadDocNotifCtx>>>,
  eventKey: string,
  title: string,
  body: string,
  deepLink: string,
) {
  for (const cc of ctx.ccRecipients) {
    try {
      await createNotification({
        companyId: ctx.companyId,
        recipientEmployeeId: cc.employeeId,
        category: "APPROVAL",
        eventKey,
        title,
        body,
        deepLink,
        relatedTargetType: "FormDocument",
      });
    } catch {
      // 개별 실패는 무시
    }
  }
}

export async function approveDocument(
  actorId: string,
  lineId: string,
  comment?: string,
): Promise<Result<void>> {
  const line = await prisma.approvalLine.findUnique({
    where: { id: lineId },
    select: { id: true, documentId: true, step: true, approverId: true, status: true, document: { select: { kind: true, status: true } } },
  });
  if (!line) return err(errors.notFound("결재 항목을 찾을 수 없어요"));
  if (line.approverId !== actorId) return err(errors.forbidden("본인 결재 항목만 처리할 수 있어요"));
  if (line.status !== "PENDING") return err(errors.validation("대기 중인 항목만 처리할 수 있어요"));
  if (line.document.status === "CANCELLED" || line.document.status === "REJECTED") {
    return err(errors.validation("이미 종료된 문서예요"));
  }

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
  if (docApproved && line.document.kind === "LEAVE_PLAN") {
    await finalizeLeavePlanFromDocument(line.documentId, true);
  }

  // 알림 (실패해도 결재 처리는 보존)
  try {
    const ctx = await loadDocNotifCtx(line.documentId);
    if (ctx) {
      if (!docApproved) {
        // 중간 단계 승인 → 다음 결재자 알림
        const nextLine = await prisma.approvalLine.findFirst({
          where: { documentId: line.documentId, step: line.step + 1 },
          select: { approverId: true },
        });
        if (nextLine) {
          await createNotification({
            companyId: ctx.companyId,
            recipientEmployeeId: nextLine.approverId,
            category: "APPROVAL",
            eventKey: "workflow.approval.requested",
            title: `결재 차례가 됐어요`,
            body: `"${ctx.title}" 문서의 결재 차례가 됐어요.`,
            deepLink: "/workflow?tab=pending",
            relatedTargetType: "FormDocument",
          });
        }
      } else {
        // 최종 승인 → 기안자 알림 (LEAVE는 finalizeLeave*가 처리)
        if (ctx.kind !== "LEAVE_REQUEST" && ctx.kind !== "LEAVE_PLAN") {
          await createNotification({
            companyId: ctx.companyId,
            recipientEmployeeId: ctx.authorId,
            category: "APPROVAL",
            eventKey: "workflow.document.approved",
            title: `결재가 완료됐어요`,
            body: `"${ctx.title}" 문서가 최종 승인됐어요.`,
            deepLink: "/workflow?tab=sent",
            relatedTargetType: "FormDocument",
          });
        }
        // 최종 승인 → CC 참조자 알림
        await notifyCc(ctx, "workflow.document.approved.cc", "참조 문서가 승인됐어요",
          `"${ctx.title}" 문서가 최종 승인됐어요.`, "/workflow?tab=cc");
      }
    }
  } catch (e) {
    console.error("[approval] 승인 알림 실패:", e);
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
    select: { id: true, documentId: true, approverId: true, status: true, document: { select: { kind: true, status: true } } },
  });
  if (!line) return err(errors.notFound("결재 항목을 찾을 수 없어요"));
  if (line.approverId !== actorId) return err(errors.forbidden("본인 결재 항목만 처리할 수 있어요"));
  if (line.status !== "PENDING") return err(errors.validation("대기 중인 항목만 처리할 수 있어요"));
  if (line.document.status === "CANCELLED" || line.document.status === "REJECTED") {
    return err(errors.validation("이미 종료된 문서예요"));
  }

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
  if (line.document.kind === "LEAVE_PLAN") {
    await finalizeLeavePlanFromDocument(line.documentId, false);
  }

  // 알림 (실패해도 결재 처리는 보존)
  try {
    const ctx = await loadDocNotifCtx(line.documentId);
    if (ctx) {
      // 기안자 알림 (LEAVE는 finalizeLeave*가 처리)
      if (ctx.kind !== "LEAVE_REQUEST" && ctx.kind !== "LEAVE_PLAN") {
        await createNotification({
          companyId: ctx.companyId,
          recipientEmployeeId: ctx.authorId,
          category: "APPROVAL",
          eventKey: "workflow.document.rejected",
          title: `결재가 반려됐어요`,
          body: `"${ctx.title}" 문서가 반려됐어요. 사유를 확인해 주세요.`,
          deepLink: "/workflow?tab=sent",
          relatedTargetType: "FormDocument",
        });
      }
      // CC 참조자 알림
      await notifyCc(ctx, "workflow.document.rejected.cc", "참조 문서가 반려됐어요",
        `"${ctx.title}" 문서가 반려됐어요.`, "/workflow?tab=cc");
    }
  } catch (e) {
    console.error("[approval] 반려 알림 실패:", e);
  }

  return ok(undefined);
}
