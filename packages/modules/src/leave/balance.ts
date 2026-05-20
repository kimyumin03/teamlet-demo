import { prisma } from "@teamlet/db";
import { ok, err, type Result } from "@teamlet/shared";
import type { GrantLeaveInput, LeaveBalanceSummary } from "./types";

export async function getLeaveBalances(
  employeeId: string,
  year: number,
): Promise<Result<LeaveBalanceSummary[]>> {
  const balances = await prisma.leaveBalance.findMany({
    where: { employeeId, year },
    include: { leaveType: { select: { name: true, key: true, isActive: true } } },
  });

  return ok(
    balances
      .filter((b) => b.leaveType.isActive)
      .map((b) => {
        const granted = Number(b.grantedDays);
        const used = Number(b.usedDays);
        const adjusted = Number(b.adjustedDays);
        return {
          leaveTypeId: b.leaveTypeId,
          leaveTypeName: b.leaveType.name,
          leaveTypeKey: b.leaveType.key,
          grantedDays: granted,
          usedDays: used,
          adjustedDays: adjusted,
          remainingDays: granted - used + adjusted,
        };
      }),
  );
}

export async function grantLeave(
  actorId: string,
  input: GrantLeaveInput,
): Promise<Result<void>> {
  const { employeeId, leaveTypeId, days, category, reason, note } = input;
  const year = new Date().getFullYear();

  await prisma.$transaction([
    prisma.leaveTransaction.create({
      data: {
        employeeId,
        leaveTypeId,
        category,
        txType: "GRANT",
        days,
        reason: reason ?? "관리자 부여",
        note,
        actorId,
      },
    }),
    prisma.leaveBalance.upsert({
      where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
      create: { employeeId, leaveTypeId, year, grantedDays: days },
      update: { grantedDays: { increment: days } },
    }),
  ]);

  return ok(undefined);
}

export async function adjustLeave(
  actorId: string,
  input: { employeeId: string; leaveTypeId: string; days: number; reason?: string; note?: string },
): Promise<Result<void>> {
  const { employeeId, leaveTypeId, days, reason, note } = input;
  const year = new Date().getFullYear();

  await prisma.$transaction([
    prisma.leaveTransaction.create({
      data: {
        employeeId,
        leaveTypeId,
        category: "ADJUSTMENT",
        txType: "ADJUST",
        days,
        reason: reason ?? "관리자 조정",
        note,
        actorId,
      },
    }),
    prisma.leaveBalance.upsert({
      where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
      create: { employeeId, leaveTypeId, year, adjustedDays: days },
      update: { adjustedDays: { increment: days } },
    }),
  ]);

  return ok(undefined);
}
