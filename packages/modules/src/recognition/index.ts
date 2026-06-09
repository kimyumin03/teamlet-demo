import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { hasPermission } from "../permission/assert";

const DIRECTORY_MANAGE = "member.directory.manage";

/**
 * 인정·피드백 — 개인 간 메시지(공용 아님).
 * 보낸 사람 → 받는 사람. 수신자 본인만 자기 받은 메시지를 봄.
 */

export type RecognitionKindValue = "RECOGNITION" | "FEEDBACK";

export type ReceivedRecognition = {
  id: string;
  kind: RecognitionKindValue;
  message: string;
  senderName: string;
  isRead: boolean;
  createdAt: Date;
};

export async function sendRecognition(
  senderId: string,
  input: { recipientId: string; kind: RecognitionKindValue; message: string },
): Promise<Result<{ id: string }>> {
  const sender = await prisma.employee.findUnique({
    where: { id: senderId },
    select: { companyId: true },
  });
  if (!sender) return err(errors.notFound("보내는 사람 정보를 찾을 수 없어요"));
  if (!input.message.trim()) return err(errors.validation("메시지를 입력해 주세요"));
  if (input.recipientId === senderId) return err(errors.validation("본인에게는 보낼 수 없어요"));

  // 수신자가 같은 회사 소속인지 검증 (멀티테넌시 격리)
  const recipient = await prisma.employee.findFirst({
    where: { id: input.recipientId, companyId: sender.companyId, isActive: true },
    select: { id: true },
  });
  if (!recipient) return err(errors.notFound("받는 구성원을 찾을 수 없어요"));

  const row = await prisma.recognition.create({
    data: {
      companyId: sender.companyId,
      senderId,
      recipientId: input.recipientId,
      kind: input.kind,
      message: input.message.trim(),
    },
    select: { id: true },
  });
  return ok({ id: row.id });
}

/** 내가 받은 인정·피드백 (개인). 최대 50건 최근순.
 *  ⚠️ 신규 모델 — Prisma client 미반영(dev 미재시작) 시 빈 배열로 degrade. */
export async function listReceivedRecognitions(employeeId: string): Promise<ReceivedRecognition[]> {
  try {
    const rows = await prisma.recognition.findMany({
      where: { recipientId: employeeId },
      include: { sender: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      message: r.message,
      senderName: r.sender.name,
      isRead: r.isRead,
      createdAt: r.createdAt,
    }));
  } catch {
    return [];
  }
}

/**
 * 받은 인정·피드백 삭제.
 * 수신자 본인 또는 member.directory.manage 권한자만 삭제 가능.
 */
export async function deleteRecognition(
  actorId: string,
  recognitionId: string,
): Promise<Result<void>> {
  const row = await prisma.recognition.findUnique({
    where: { id: recognitionId },
    select: { recipientId: true, companyId: true },
  });
  if (!row) return err(errors.notFound("메시지를 찾을 수 없어요"));

  const actor = await prisma.employee.findUnique({
    where: { id: actorId },
    select: { companyId: true },
  });
  if (!actor || actor.companyId !== row.companyId)
    return err(errors.forbidden("권한이 없어요"));

  const isRecipient = row.recipientId === actorId;
  const isAdmin = await hasPermission(actorId, DIRECTORY_MANAGE);
  if (!isRecipient && !isAdmin)
    return err(errors.forbidden("수신자 본인 또는 관리자만 삭제할 수 있어요"));

  await prisma.recognition.delete({ where: { id: recognitionId } });
  return ok(undefined);
}

/** 받은 인정·피드백 읽음 처리 (탭 진입 시). */
export async function markRecognitionsRead(employeeId: string): Promise<Result<void>> {
  try {
    await prisma.recognition.updateMany({
      where: { recipientId: employeeId, isRead: false },
      data: { isRead: true },
    });
  } catch {
    // 신규 모델 미반영 시 무동작
  }
  return ok(undefined);
}
