import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import type { RequestLeaveInput } from "./types";

export async function requestLeave(
  input: RequestLeaveInput,
): Promise<Result<{ id: string }>> {
  const { employeeId, leaveTypeId, startDate, endDate, days, reason } = input;

  const leaveType = await prisma.leaveType.findUnique({
    where: { id: leaveTypeId },
    select: { isActive: true },
  });
  if (!leaveType?.isActive) return err(errors.badRequest("비활성 휴가 종류예요"));

  const year = startDate.getFullYear();
  const balance = await prisma.leaveBalance.findUnique({
    where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
    select: { grantedDays: true, usedDays: true, adjustedDays: true },
  });

  const remaining = balance
    ? Number(balance.grantedDays) - Number(balance.usedDays) + Number(balance.adjustedDays)
    : 0;

  if (remaining < days)
    return err(errors.badRequest(`잔여 휴가가 부족해요 (잔여 ${remaining}일, 신청 ${days}일)`));

  const req = await prisma.leaveRequest.create({
    data: { employeeId, leaveTypeId, startDate, endDate, days, reason: reason ?? "" },
    select: { id: true },
  });

  return ok(req);
}

export async function approveLeave(
  actorId: string,
  requestId: string,
): Promise<Result<void>> {
  const req = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    select: { id: true, employeeId: true, leaveTypeId: true, days: true, status: true, startDate: true },
  });
  if (!req) return err(errors.notFound("휴가 신청을 찾을 수 없어요"));
  if (req.status !== "PENDING") return err(errors.badRequest("대기 중인 신청만 승인할 수 있어요"));

  const year = req.startDate.getFullYear();

  await prisma.$transaction([
    prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", reviewedAt: new Date(), reviewedBy: actorId },
    }),
    prisma.leaveTransaction.create({
      data: {
        employeeId: req.employeeId,
        leaveTypeId: req.leaveTypeId,
        category: "ANNUAL",
        txType: "USE",
        days: -Number(req.days),
        reason: "휴가 사용",
        actorId,
        leaveRequestId: requestId,
      },
    }),
    prisma.leaveBalance.upsert({
      where: { employeeId_leaveTypeId_year: { employeeId: req.employeeId, leaveTypeId: req.leaveTypeId, year } },
      create: { employeeId: req.employeeId, leaveTypeId: req.leaveTypeId, year, usedDays: Number(req.days) },
      update: { usedDays: { increment: Number(req.days) } },
    }),
  ]);

  return ok(undefined);
}

export async function rejectLeave(
  actorId: string,
  requestId: string,
  reviewNote?: string,
): Promise<Result<void>> {
  const req = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    select: { status: true },
  });
  if (!req) return err(errors.notFound("휴가 신청을 찾을 수 없어요"));
  if (req.status !== "PENDING") return err(errors.badRequest("대기 중인 신청만 반려할 수 있어요"));

  await prisma.leaveRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", reviewedAt: new Date(), reviewedBy: actorId, reviewNote },
  });

  return ok(undefined);
}

export async function cancelLeave(
  requestId: string,
  employeeId: string,
): Promise<Result<void>> {
  const req = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    select: { employeeId: true, leaveTypeId: true, days: true, status: true, startDate: true },
  });
  if (!req) return err(errors.notFound("휴가 신청을 찾을 수 없어요"));
  if (req.employeeId !== employeeId) return err(errors.forbidden("본인 신청만 취소할 수 있어요"));
  if (!["PENDING", "APPROVED"].includes(req.status))
    return err(errors.badRequest("취소할 수 없는 상태예요"));

  const year = req.startDate.getFullYear();
  const wasApproved = req.status === "APPROVED";

  await prisma.$transaction([
    prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
    }),
    ...(wasApproved
      ? [
          prisma.leaveTransaction.create({
            data: {
              employeeId: req.employeeId,
              leaveTypeId: req.leaveTypeId,
              category: "ANNUAL",
              txType: "ADJUST",
              days: Number(req.days),
              reason: "휴가 취소 복원",
              leaveRequestId: requestId,
            },
          }),
          prisma.leaveBalance.update({
            where: {
              employeeId_leaveTypeId_year: {
                employeeId: req.employeeId,
                leaveTypeId: req.leaveTypeId,
                year,
              },
            },
            data: { usedDays: { decrement: Number(req.days) } },
          }),
        ]
      : []),
  ]);

  return ok(undefined);
}
