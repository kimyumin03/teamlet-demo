import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { catchDomainErr, loadActor } from "../permission/_actor";
import { assertPermission } from "../permission/assert";
import { getEffectivePermissions } from "../permission/effective";
import type { RequestLeaveInput, LeaveRequestItem, PendingLeaveRequestItem } from "./types";

const BALANCE_READ = "leave.balance.read";
const BALANCE_MANAGE = "leave.balance.manage";

export async function listPendingLeaveRequests(
  actorEmployeeId: string,
): Promise<Result<PendingLeaveRequestItem[]>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  // 휴가 승인 권한 + scope 확인 (DEPARTMENT scope는 해당 부서 신청만)
  const perms = await getEffectivePermissions(actorEmployeeId);
  const perm = perms.get(BALANCE_MANAGE);
  if (!perm) return err(errors.forbidden("휴가 신청 목록을 볼 권한이 없어요"));

  const scopedDeptIds =
    perm.scopeType === "DEPARTMENT" && perm.departmentIds.length > 0
      ? perm.departmentIds
      : null;

  const requests = await prisma.leaveRequest.findMany({
    where: {
      employee: {
        companyId: actor.companyId,
        ...(scopedDeptIds ? { departmentId: { in: scopedDeptIds } } : {}),
      },
      status: "PENDING",
    },
    include: {
      employee: { select: { name: true } },
      leaveType: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return ok(
    requests.map((r) => ({
      id: r.id,
      employeeName: r.employee.name,
      leaveTypeName: r.leaveType.name,
      startDate: r.startDate,
      endDate: r.endDate,
      days: Number(r.days),
      reason: r.reason,
      createdAt: r.createdAt,
    })),
  );
}

export async function listMyLeaveRequests(
  employeeId: string,
): Promise<Result<LeaveRequestItem[]>> {
  const requests = await prisma.leaveRequest.findMany({
    where: { employeeId },
    include: { leaveType: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return ok(
    requests.map((r) => ({
      id: r.id,
      leaveTypeName: r.leaveType.name,
      startDate: r.startDate,
      endDate: r.endDate,
      days: Number(r.days),
      reason: r.reason,
      status: r.status,
      reviewNote: r.reviewNote,
      createdAt: r.createdAt,
    })),
  );
}

/** HR이 특정 직원의 휴가 신청 이력 조회 (같은 회사 내 directory.read 권한 필요). */
export async function listEmployeeLeaveHistory(
  actorEmployeeId: string,
  targetEmployeeId: string,
): Promise<Result<LeaveRequestItem[]>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const target = await prisma.employee.findUnique({
    where: { id: targetEmployeeId },
    select: { companyId: true, departmentId: true },
  });
  if (!target || target.companyId !== actor.companyId) {
    return err(errors.notFound("직원을 찾을 수 없어요"));
  }

  // 본인 이력은 권한 없이, 타인 이력은 leave.balance.read 권한 필요
  if (targetEmployeeId !== actorEmployeeId) {
    try {
      await assertPermission(actorEmployeeId, BALANCE_READ, {
        targetEmployeeId,
        targetDepartmentId: target.departmentId ?? undefined,
      });
    } catch (e) {
      return catchDomainErr(e);
    }
  }

  const requests = await prisma.leaveRequest.findMany({
    where: { employeeId: targetEmployeeId },
    include: { leaveType: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return ok(
    requests.map((r) => ({
      id: r.id,
      leaveTypeName: r.leaveType.name,
      startDate: r.startDate,
      endDate: r.endDate,
      days: Number(r.days),
      reason: r.reason,
      status: r.status,
      reviewNote: r.reviewNote,
      createdAt: r.createdAt,
    })),
  );
}

export async function requestLeave(
  input: RequestLeaveInput,
): Promise<Result<{ id: string }>> {
  const { employeeId, leaveTypeId, startDate, endDate, days, reason } = input;

  const leaveType = await prisma.leaveType.findUnique({
    where: { id: leaveTypeId },
    select: { isActive: true },
  });
  if (!leaveType?.isActive) return err(errors.validation("비활성 휴가 종류예요"));

  const year = startDate.getFullYear();
  const balance = await prisma.leaveBalance.findUnique({
    where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
    select: { grantedDays: true, usedDays: true, adjustedDays: true },
  });

  const remaining = balance
    ? Number(balance.grantedDays) - Number(balance.usedDays) + Number(balance.adjustedDays)
    : 0;

  if (remaining < days)
    return err(errors.validation(`잔여 휴가가 부족해요 (잔여 ${remaining}일, 신청 ${days}일)`));

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
    select: {
      id: true,
      employeeId: true,
      leaveTypeId: true,
      days: true,
      status: true,
      startDate: true,
      employee: { select: { departmentId: true } },
    },
  });
  if (!req) return err(errors.notFound("휴가 신청을 찾을 수 없어요"));
  if (req.status !== "PENDING") return err(errors.validation("대기 중인 신청만 승인할 수 있어요"));

  try {
    await assertPermission(actorId, BALANCE_MANAGE, {
      targetEmployeeId: req.employeeId,
      targetDepartmentId: req.employee.departmentId ?? undefined,
    });
  } catch (e) {
    return catchDomainErr(e);
  }

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
    select: {
      status: true,
      employeeId: true,
      employee: { select: { departmentId: true } },
    },
  });
  if (!req) return err(errors.notFound("휴가 신청을 찾을 수 없어요"));
  if (req.status !== "PENDING") return err(errors.validation("대기 중인 신청만 반려할 수 있어요"));

  try {
    await assertPermission(actorId, BALANCE_MANAGE, {
      targetEmployeeId: req.employeeId,
      targetDepartmentId: req.employee.departmentId ?? undefined,
    });
  } catch (e) {
    return catchDomainErr(e);
  }

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
    return err(errors.validation("취소할 수 없는 상태예요"));

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
