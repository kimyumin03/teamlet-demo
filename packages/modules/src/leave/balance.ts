import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import type { GrantLeaveInput, LeaveBalanceSummary, LeaveTypeItem } from "./types";

export async function listLeaveTypes(
  employeeId: string,
): Promise<Result<LeaveTypeItem[]>> {
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const types = await prisma.leaveType.findMany({
    where: { companyId: emp.companyId, isActive: true },
    select: { id: true, name: true, key: true, grantAmount: true },
    orderBy: { sortOrder: "asc" },
  });

  return ok(
    types.map((t) => ({
      id: t.id,
      name: t.name,
      key: t.key,
      grantAmount: t.grantAmount ? Number(t.grantAmount) : null,
    })),
  );
}

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
