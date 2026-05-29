import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { catchDomainErr, loadActor } from "../permission/_actor";
import { assertPermission } from "../permission/assert";
import { getEffectivePermissions } from "../permission/effective";
import type { GrantLeaveInput, LeaveBalanceSummary, LeaveTypeItem, CompanyLeaveBalanceRow } from "./types";

const ADJUST_EXECUTE = "leave.adjust.execute";
const BALANCE_MANAGE = "leave.balance.manage";

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
  try {
    await assertPermission(actorId, ADJUST_EXECUTE);
  } catch (e) {
    return catchDomainErr(e);
  }

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

export async function listCompanyLeaveBalances(
  actorEmployeeId: string,
  year: number,
): Promise<Result<CompanyLeaveBalanceRow[]>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const perms = await getEffectivePermissions(actorEmployeeId);
  if (!perms.has(BALANCE_MANAGE)) return err(errors.forbidden("휴가 현황을 볼 권한이 없어요"));

  const leaveTypes = await prisma.leaveType.findMany({
    where: { companyId: actor.companyId, isActive: true },
    select: { id: true, key: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  const employees = await prisma.employee.findMany({
    where: { companyId: actor.companyId, isActive: true },
    select: {
      id: true,
      name: true,
      employeeNumber: true,
      hireDate: true,
      department: { select: { name: true } },
      position: { select: { name: true } },
      leaveBalances: {
        where: { year },
        select: { leaveTypeId: true, grantedDays: true, usedDays: true, adjustedDays: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return ok(
    employees.map((emp) => ({
      employeeId: emp.id,
      employeeName: emp.name,
      employeeNumber: emp.employeeNumber,
      departmentName: emp.department?.name ?? null,
      positionName: emp.position?.name ?? null,
      hireDate: emp.hireDate,
      balances: leaveTypes.map((lt) => {
        const bal = emp.leaveBalances.find((b) => b.leaveTypeId === lt.id);
        const granted = bal ? Number(bal.grantedDays) : 0;
        const used = bal ? Number(bal.usedDays) : 0;
        const adjusted = bal ? Number(bal.adjustedDays) : 0;
        return {
          leaveTypeId: lt.id,
          leaveTypeKey: lt.key,
          leaveTypeName: lt.name,
          grantedDays: granted,
          usedDays: used,
          adjustedDays: adjusted,
          remainingDays: granted - used + adjusted,
        };
      }),
    })),
  );
}

/** 연도 말 연차 소멸·이월 처리 (manual trigger).
 *  - 해당 연도 잔여 일수가 0 초과인 잔액에 대해 EXPIRE 트랜잭션 생성.
 *  - 정책에 carryoverMaxDays 가 있으면 min(잔여, carryover) 만큼 다음 연도 GRANT.
 *  - 동일 연도·직원·유형에 EXPIRE 이미 있으면 스킵 (멱등).
 */
export async function processLeaveExpiry(
  actorEmployeeId: string,
  year: number,
): Promise<Result<{ expired: number; carriedOver: number }>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const perms = await getEffectivePermissions(actorEmployeeId);
  if (!perms.has(BALANCE_MANAGE)) return err(errors.forbidden("연차 소멸을 실행할 권한이 없어요"));

  // 해당 연도 잔액 + 정책 배정 한꺼번에 조회
  const balances = await prisma.leaveBalance.findMany({
    where: {
      employee: { companyId: actor.companyId, isActive: true },
      year,
    },
    include: {
      employee: {
        select: {
          id: true,
          hireDate: true,
          leavePolicyAssignments: {
            include: { policy: { select: { leaveTypeId: true, expiryMonths: true, carryoverMaxDays: true, grantMode: true, fiscalStartMonth: true } } },
            orderBy: { effectiveDate: "desc" },
          },
        },
      },
    },
  });

  let expired = 0;
  let carriedOver = 0;
  const now = new Date();

  for (const bal of balances) {
    const remaining = Number(bal.grantedDays) + Number(bal.adjustedDays) - Number(bal.usedDays);
    if (remaining <= 0) continue;

    // 멱등: 해당 연도 잔액(employeeId·leaveTypeId·year 고유)이 이미 처리됐으면 skip.
    // 마커는 잔액 행에 두므로 소멸/이월 어느 쪽이 발생했든 재실행 시 정확히 1회만 처리됨
    // (이전 구현은 txType=EXPIRE 트랜잭션을 year 무관하게 조회 → 첫 해 이후 영구 skip 되는 버그).
    if (bal.expiryProcessedAt) continue;

    // 해당 휴가 유형의 정책 찾기
    const assignment = bal.employee.leavePolicyAssignments.find(
      (a) => a.policy.leaveTypeId === bal.leaveTypeId,
    );
    if (!assignment) continue;

    const { expiryMonths, carryoverMaxDays, grantMode, fiscalStartMonth } = assignment.policy;

    // 소멸 기준일 계산
    let expiryDate: Date;
    if (grantMode === "HIRE_DATE" && bal.employee.hireDate) {
      const hd = new Date(bal.employee.hireDate);
      expiryDate = new Date(hd);
      expiryDate.setFullYear(year);
      expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);
    } else {
      // FISCAL_YEAR: 회계연도 시작월 + expiryMonths
      expiryDate = new Date(year, fiscalStartMonth - 1 + expiryMonths, 1);
    }

    if (now < expiryDate) continue;

    const carryover = carryoverMaxDays ? Math.min(remaining, Number(carryoverMaxDays)) : 0;
    const expireAmount = remaining - carryover;

    const ops = [];

    // 잔액 행: 소멸분은 grantedDays 에서 차감(adjustedDays 는 관리자 수동조정 전용이라 오염 금지),
    // 멱등 마커는 소멸·이월 여부와 무관하게 항상 set → 재실행 시 이중 처리 방지.
    ops.push(
      prisma.leaveBalance.update({
        where: { id: bal.id },
        data: {
          ...(expireAmount > 0 && { grantedDays: { decrement: expireAmount } }),
          expiryProcessedAt: now,
        },
      }),
    );

    if (expireAmount > 0) {
      ops.push(
        prisma.leaveTransaction.create({
          data: {
            employeeId: bal.employeeId,
            leaveTypeId: bal.leaveTypeId,
            category: "ADJUSTMENT",
            txType: "EXPIRE",
            days: -expireAmount,
            reason: `${year}년 연차 소멸`,
            actorId: actorEmployeeId,
          },
        }),
      );
      expired++;
    }

    if (carryover > 0) {
      ops.push(
        prisma.leaveTransaction.create({
          data: {
            employeeId: bal.employeeId,
            leaveTypeId: bal.leaveTypeId,
            category: "ADJUSTMENT",
            txType: "GRANT",
            days: carryover,
            reason: `${year}년 → ${year + 1}년 이월`,
            actorId: actorEmployeeId,
          },
        }),
        prisma.leaveBalance.upsert({
          where: { employeeId_leaveTypeId_year: { employeeId: bal.employeeId, leaveTypeId: bal.leaveTypeId, year: year + 1 } },
          create: { employeeId: bal.employeeId, leaveTypeId: bal.leaveTypeId, year: year + 1, grantedDays: carryover },
          update: { grantedDays: { increment: carryover } },
        }),
      );
      carriedOver++;
    }

    if (ops.length > 0) await prisma.$transaction(ops);
  }

  return ok({ expired, carriedOver });
}

export async function adjustLeave(
  actorId: string,
  input: { employeeId: string; leaveTypeId: string; days: number; reason?: string; note?: string },
): Promise<Result<void>> {
  try {
    await assertPermission(actorId, ADJUST_EXECUTE);
  } catch (e) {
    return catchDomainErr(e);
  }

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
