import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result, computeAnnualExpiryDate, computeMonthlyExpiryDate } from "@teamlet/shared";
import { catchDomainErr, loadActor } from "../permission/_actor";
import { assertPermission } from "../permission/assert";
import { getEffectivePermissions } from "../permission/effective";
import type { GrantLeaveInput, LeaveBalanceSummary, LeaveTypeItem, CompanyLeaveBalanceRow, AnnualLeaveLedger, AnnualLeaveLedgerRow, MonthlyAnnualUsageRow } from "./types";

const ADJUST_EXECUTE = "leave.adjust.execute";
const BALANCE_MANAGE = "leave.balance.manage";

/** hireDate 기준 만 근속연수 (연 단위 절사) */
function calcTenureYears(hireDate: Date): number {
  const now = new Date();
  let years = now.getFullYear() - hireDate.getFullYear();
  const monthDiff = now.getMonth() - hireDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < hireDate.getDate())) years--;
  return Math.max(0, years);
}

export async function listLeaveTypes(
  employeeId: string,
): Promise<Result<LeaveTypeItem[]>> {
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true, gender: true, hireDate: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const types = await prisma.leaveType.findMany({
    where: { companyId: emp.companyId, isActive: true },
    select: {
      id: true, name: true, key: true, grantAmount: true,
      grantMethod: true, grantUnit: true, paymentType: true, evidenceRequirement: true,
      approverEmployeeId: true, ccEmployeeIds: true,
      approver: { select: { name: true } },
      genderRestriction: true,
      periodicCycle: true,
      tenureYears: true,
    },
    orderBy: { sortOrder: "asc" },
  });

  const tenureYears = emp.hireDate ? calcTenureYears(emp.hireDate) : 0;

  // 성별 + 근속 필터
  // - 성별: 구성원 성별이 지정돼 있으면 맞지 않는 휴가 종류 제외 (미기입·OTHER = 전부 노출)
  // - 근속: ON_TENURE 휴가는 tenureYears 이상 근속한 경우에만 노출
  const filtered = types.filter((t) => {
    if (t.genderRestriction !== "ALL") {
      if (emp.gender && emp.gender !== "OTHER" && t.genderRestriction !== emp.gender) return false;
    }
    if (t.grantMethod === "ON_TENURE" && t.tenureYears != null) {
      if (tenureYears < t.tenureYears) return false;
    }
    return true;
  });

  // 고정 참조자 이름 일괄 조회 (확인화면 verbatim 문구용)
  const allCcIds = [...new Set(filtered.flatMap((t) => t.ccEmployeeIds))];
  const ccEmps = allCcIds.length
    ? await prisma.employee.findMany({ where: { id: { in: allCcIds } }, select: { id: true, name: true } })
    : [];
  const ccNameMap = new Map(ccEmps.map((e) => [e.id, e.name]));

  // ON_REQUEST with grantAmount → 현재 주기(월/연) 사용량 계산
  // 사전 부여(연차·ON_HIRE·ON_TENURE·MANUAL)가 아닌 것 + grantAmount 있는 것만 집계
  const now = new Date();
  const cappedTypes = filtered.filter(
    (t) =>
      t.key !== "annual" &&
      t.grantMethod !== "ON_HIRE" &&
      t.grantMethod !== "ON_TENURE" &&
      t.grantMethod !== "MANUAL" &&
      t.grantAmount != null,
  );
  const periodicUsageMap = new Map<string, number>();
  if (cappedTypes.length > 0) {
    await Promise.all(
      cappedTypes.map(async (t) => {
        const monthly = !!t.periodicCycle && t.periodicCycle.startsWith("monthly");
        const winStart = monthly
          ? new Date(now.getFullYear(), now.getMonth(), 1)
          : new Date(`${now.getFullYear()}-01-01`);
        const winEnd = monthly
          ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
          : new Date(`${now.getFullYear() + 1}-01-01`);
        const agg = await prisma.leaveRequest.aggregate({
          where: {
            employeeId,
            leaveTypeId: t.id,
            status: { in: ["PENDING", "APPROVED"] },
            startDate: { gte: winStart, lt: winEnd },
          },
          _sum: { days: true },
        });
        periodicUsageMap.set(t.id, Number(agg._sum.days ?? 0));
      }),
    );
  }

  return ok(
    filtered.map((t) => ({
      id: t.id,
      name: t.name,
      key: t.key,
      grantAmount: t.grantAmount ? Number(t.grantAmount) : null,
      grantMethod: t.grantMethod,
      grantUnit: t.grantUnit,
      paymentType: t.paymentType,
      evidenceRequirement: t.evidenceRequirement,
      approverEmployeeId: t.approverEmployeeId,
      approverName: t.approver?.name ?? null,
      ccNames: t.ccEmployeeIds.map((id) => ccNameMap.get(id)).filter((n): n is string => !!n),
      periodicCycle: t.periodicCycle,
      periodicUsed: periodicUsageMap.get(t.id) ?? null,
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
      gender: true,
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
      gender: emp.gender,
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
      leaveType: { select: { key: true } },
      employee: {
        select: {
          id: true,
          hireDate: true,
          leavePolicyAssignments: {
            include: { policy: { select: {
              leaveTypeId: true, expiryMonths: true, carryoverMaxDays: true, grantMode: true, fiscalStartMonth: true,
              annualExpiryMode: true, annualGraceMonths: true, monthlyExpiryMode: true, monthlyGraceMonths: true,
            } } },
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

    const p = assignment.policy;
    const { carryoverMaxDays, grantMode, fiscalStartMonth } = p;

    // 휴가유형에 맞는 소멸 모드/유예 선택 (연차 vs 월차)
    const isAnnual = bal.leaveType.key === "annual";
    const expiryMode = isAnnual ? p.annualExpiryMode : p.monthlyExpiryMode;
    // 유예 개월수 — 1년에 **추가**되는 기간(없으면 0). 이전 구현은 grace 가 12개월을 대체하는 버그가 있었음.
    const graceMonths = (isAnnual ? p.annualGraceMonths : p.monthlyGraceMonths) ?? 0;

    // 정책이 "소멸 안 함"이면 소멸/이월 모두 건너뜀
    if (expiryMode === "NONE") continue;

    // 소멸 기준일 — 연차는 부여일(grantMode)+1년, 월차는 항상 입사일 기준(모드별 분기).
    let expiryDate: Date | null;
    if (isAnnual) {
      expiryDate = computeAnnualExpiryDate({
        year,
        grantMode,
        fiscalStartMonth,
        hireDate: bal.employee.hireDate,
        graceMonths,
      });
    } else if (bal.employee.hireDate) {
      expiryDate = computeMonthlyExpiryDate({
        mode: expiryMode as "HIRE_DATE_1Y" | "HIRE_DATE_1Y_FISCAL",
        hireDate: bal.employee.hireDate,
        fiscalStartMonth,
        graceMonths,
      });
    } else {
      expiryDate = null; // 월차인데 입사일 미상 → 소멸 판단 불가, 보존
    }

    if (!expiryDate || now < expiryDate) continue;

    // 이월은 **연차 전용**(월차는 이월 없이 전액 소멸). carryoverMaxDays 한도까지 다음 해로 이월.
    const carryover = isAnnual && carryoverMaxDays ? Math.min(remaining, Number(carryoverMaxDays)) : 0;
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
            reason: `${year}년 ${isAnnual ? "연차" : "월차"} 소멸`,
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

export type LeaveGrantHistoryRow = {
  id: string;
  occurredAt: Date;
  employeeId: string;
  employeeName: string;
  leaveTypeName: string;
  txType: string; // GRANT | ADJUST
  category: string;
  days: number;
  reason: string;
  actorName: string | null;
};

/** 부여·조정 내역 — LeaveTransaction(GRANT/ADJUST)을 회사 단위로 최근순 조회(최대 300건). */
export async function listLeaveGrantHistory(
  actorEmployeeId: string,
  filters?: { employeeId?: string; leaveTypeId?: string; year?: number },
): Promise<Result<LeaveGrantHistoryRow[]>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));
  const perms = await getEffectivePermissions(actorEmployeeId);
  if (!perms.has(BALANCE_MANAGE)) return err(errors.forbidden("부여 내역을 볼 권한이 없어요"));

  const year = filters?.year;
  const txs = await prisma.leaveTransaction.findMany({
    where: {
      employee: { companyId: actor.companyId },
      txType: { in: ["GRANT", "ADJUST"] },
      ...(filters?.employeeId ? { employeeId: filters.employeeId } : {}),
      ...(filters?.leaveTypeId ? { leaveTypeId: filters.leaveTypeId } : {}),
      ...(year
        ? { occurredAt: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) } }
        : {}),
    },
    include: {
      employee: { select: { name: true } },
      leaveType: { select: { name: true } },
      actor: { select: { name: true } },
    },
    orderBy: { occurredAt: "desc" },
    take: 300,
  });

  return ok(
    txs.map((t) => ({
      id: t.id,
      occurredAt: t.occurredAt,
      employeeId: t.employeeId,
      employeeName: t.employee.name,
      leaveTypeName: t.leaveType.name,
      txType: t.txType,
      category: t.category,
      days: Number(t.days),
      reason: t.reason,
      actorName: t.actor?.name ?? null,
    })),
  );
}

/** 연차 상세 탭 — 연도별 월별 원장 집계.
 *  LeaveTransaction(key="annual")을 월별로 그룹핑해 GRANT/EXPIRE/USE/ADJUST 분류 + 누적 잔여.
 */
export async function getAnnualLeaveLedger(
  employeeId: string,
  year: number,
): Promise<Result<AnnualLeaveLedger>> {
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true, hireDate: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const annualType = await prisma.leaveType.findFirst({
    where: { companyId: emp.companyId, key: "annual", isActive: true },
    select: { id: true },
  });

  if (!annualType) {
    return ok({ year, hasAnnualType: false, rows: [], summary: { granted: 0, expired: 0, used: 0, adjusted: 0 } });
  }

  const txs = await prisma.leaveTransaction.findMany({
    where: {
      employeeId,
      leaveTypeId: annualType.id,
      occurredAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
    orderBy: { occurredAt: "asc" },
  });

  const now = new Date();
  const currentMonth = now.getFullYear() === year ? now.getMonth() + 1 : (year < now.getFullYear() ? 12 : 0);
  const hireDate = emp.hireDate ? new Date(emp.hireDate) : null;
  const hireMonth = hireDate && hireDate.getFullYear() === year ? hireDate.getMonth() + 1 : null;

  type MonthAgg = { granted: number; expired: number; used: number; adjusted: number };
  const monthMap: MonthAgg[] = Array.from({ length: 13 }, () => ({ granted: 0, expired: 0, used: 0, adjusted: 0 }));

  for (const tx of txs) {
    const m = new Date(tx.occurredAt).getMonth() + 1;
    const days = Number(tx.days);
    const agg = monthMap[m]!;
    if (tx.txType === "GRANT") agg.granted += days;
    else if (tx.txType === "EXPIRE") agg.expired += days;
    else if (tx.txType === "USE") agg.used += days;
    else if (tx.txType === "ADJUST") agg.adjusted += days;
  }

  let cumulative = 0;
  const rows: AnnualLeaveLedgerRow[] = [];
  const summary = { granted: 0, expired: 0, used: 0, adjusted: 0 };

  for (let m = 1; m <= 12; m++) {
    const { granted, expired, used, adjusted } = monthMap[m]!;
    cumulative = cumulative + granted - expired - used + adjusted;
    summary.granted += granted;
    summary.expired += expired;
    summary.used += used;
    summary.adjusted += adjusted;
    rows.push({
      month: m,
      granted,
      expired,
      used,
      adjusted,
      remaining: Math.max(0, cumulative),
      isHireMonth: hireMonth === m,
      isCurrentMonth: currentMonth === m,
    });
  }

  return ok({ year, hasAnnualType: true, rows, summary });
}

export async function listMonthlyAnnualUsage(
  actorEmployeeId: string,
  year: number,
): Promise<Result<MonthlyAnnualUsageRow[]>> {
  try {
    await assertPermission(actorEmployeeId, BALANCE_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const annualType = await prisma.leaveType.findFirst({
    where: { companyId: emp.companyId, key: "annual" },
    select: { id: true },
  });
  if (!annualType) return ok([]);

  const [employees, balances, txns] = await Promise.all([
    prisma.employee.findMany({
      where: { companyId: emp.companyId, employmentStatus: { not: "RESIGNED" } },
      select: { id: true, name: true, employeeNumber: true, hireDate: true },
      orderBy: { name: "asc" },
    }),
    prisma.leaveBalance.findMany({
      where: { leaveTypeId: annualType.id, year },
      select: { employeeId: true, grantedDays: true, usedDays: true, adjustedDays: true },
    }),
    prisma.leaveTransaction.findMany({
      where: {
        leaveTypeId: annualType.id,
        txType: "USE",
        occurredAt: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
      },
      select: { employeeId: true, occurredAt: true, days: true },
    }),
  ]);

  const balanceMap = new Map(balances.map((b) => [b.employeeId, b]));
  const txByEmpMonth = new Map<string, number[]>();
  for (const tx of txns) {
    const month = tx.occurredAt.getMonth(); // 0-based
    if (!txByEmpMonth.has(tx.employeeId)) txByEmpMonth.set(tx.employeeId, Array(12).fill(0));
    const arr = txByEmpMonth.get(tx.employeeId);
    if (arr) arr[month] = (arr[month] ?? 0) + Number(tx.days);
  }

  return ok(
    employees.map((e) => {
      const bal = balanceMap.get(e.id);
      const granted = bal ? Number(bal.grantedDays) : 0;
      const used = bal ? Number(bal.usedDays) : 0;
      const adjusted = bal ? Number(bal.adjustedDays) : 0;
      return {
        employeeId: e.id,
        employeeName: e.name,
        employeeNumber: e.employeeNumber,
        hireDate: e.hireDate,
        remainingDays: Math.max(0, granted + adjusted - used),
        monthlyUsage: txByEmpMonth.get(e.id) ?? Array(12).fill(0),
      };
    }),
  );
}
