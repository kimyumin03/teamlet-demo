/**
 * 연차 자동부여 엔진 (MVP) — docs/03 §5 LeavePolicy.
 *
 * 정책이 배정된 직원에게 휴가 유형의 기준 일수를 연 1회 자동 부여한다.
 *  - 입사 첫 해 직원은 월할 비례(prorate) — 입사월부터 연말까지 개월수 / 12.
 *  - `decimalRule` 로 소수 보정.
 *  - 멱등 — 같은 해(year)에 이미 자동부여된 (직원·휴가유형)은 건너뜀.
 *    멱등 키: LeaveTransaction.note = "${year}년 정기 부여".
 *
 * 후순위(법령 충실 엔진에서): 격년 가산(3년+ +1일), 회계연도/입사일 모드,
 * 소멸(expiryMonths), 이월(carryoverMaxDays). 현재는 미적용.
 *
 * 트리거: 관리자 수동 실행. BullMQ 스케줄은 Worker 도입 시.
 */

import { prisma } from "@teamlet/db";
import type { DecimalRule } from "@teamlet/db";
import { err, errors, ok, type Result } from "@teamlet/shared";
import { recordAudit } from "../audit/index";
import { catchDomainErr, loadActor } from "../permission/_actor";
import { assertPermission } from "../permission/assert";
import { completedMonthsSinceHire } from "./leave-date-utils";

const POLICY_MANAGE = "leave.policy.manage";

export type AutoGrantResult = {
  year: number;
  grantedCount: number;
  grantedDays: number;
  alreadyGrantedCount: number;
  skippedNoAmountCount: number;
  noPolicyCount: number;
};

/** 소수 보정 규칙 적용. */
function roundByRule(v: number, rule: DecimalRule): number {
  if (rule === "ROUND_UP_DAY") return Math.ceil(v);
  if (rule === "ROUND_UP_HALF") return Math.ceil(v * 2) / 2;
  return Math.round(v * 10) / 10; // NO_ADJUSTMENT — 소수 1자리
}

/**
 * 입사일로부터 asOf 시점까지 만(완성) 근속 개월 수. 민법 §160(역에 의한 기간 계산) 기준.
 * - 응당일(입사 일자)에 도달해야 그 달이 1개월로 완성.
 * - 응당일이 해당 월에 없으면(예: 1/31 입사 → 2월) 그 월의 말일을 응당일로 간주.
 * 예) 2026-06-01 입사 → 2026-06-05 = 0개월 / 2026-07-01 = 1개월 / 2026-12-31 = 6개월
 *     2025-01-31 입사 → 2025-02-28 = 1개월(말일 응당) / 2025-03-30 = 1개월
 *     2025-06-01 입사 → 2026-06-01 = 12개월(만 1년)
 */
export { completedMonthsSinceHire } from "./leave-date-utils";

/**
 * 한국 근로기준법 §60 기준 연차 일수.
 * tenureYears: 부여 연도 1월1일 기준 만 근속 연수 (completedMonthsAsOf / 12)
 *
 * 근속 연수별 연차 일수:
 *  0년(1년 미만) → 11일 (월 1일 × 최대 11개월, 월할 부여 MVP 대체)
 *  1년 → 15일 / 2년 → 15일
 *  3년 → 16일 / 4년 → 16일
 *  5년 → 17일 / 6년 → 17일
 *  ...3년부터 2년마다 +1일, 최대 25일
 */
function legalAnnualDays(tenureYears: number): number {
  if (tenureYears < 1) return 11;
  const bonus = tenureYears >= 3 ? Math.floor((tenureYears - 1) / 2) : 0;
  return Math.min(25, 15 + bonus);
}

/**
 * 실제 부여 일수 계산 (회계연도 모드).
 * - 입사 연도(hireYear === grantYear): 입사월~12월 비례
 * - 1년 미만 재직(tenureYears 0, hireYear < grantYear): 전액 11일
 *   (월별 스케줄러 미도입으로 MVP 근사치 — 이중 부여는 멱등 키로 차단)
 * - 1년 이상 재직: legalAnnualDays(tenureYears) 전액
 */
function entitledDays(
  base: number,
  hireDate: Date | null,
  grantYear: number,
  rule: DecimalRule,
): number {
  if (!hireDate) return roundByRule(base, rule);
  const hireYear = hireDate.getUTCFullYear();
  if (hireYear > grantYear) return 0; // 아직 입사 전

  if (hireYear === grantYear) {
    // 입사 연도 — 입사월(0-11)부터 연말까지 개월수로 비례
    const monthsInGrantYear = 12 - hireDate.getUTCMonth();
    return roundByRule((base * monthsInGrantYear) / 12, rule);
  }

  // 이전 연도 입사 → 전액 (tenureYears 는 호출부에서 이미 정확히 계산됨)
  return roundByRule(base, rule);
}

/**
 * 연차 자동부여 실행. `leave.policy.manage` 가드.
 * 정책 배정된 직원 전원을 대상으로 멱등 부여 — 재실행해도 중복 부여되지 않는다.
 */
export async function runAnnualLeaveGrant(
  actorEmployeeId: string,
  year: number,
): Promise<Result<AutoGrantResult>> {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return err(errors.validation("부여 연도가 올바르지 않아요"));
  }

  try {
    await assertPermission(actorEmployeeId, POLICY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  // 회사의 연차 기본 정책 조회 (미배정 구성원에 사용)
  const defaultPolicy = await prisma.leavePolicy.findFirst({
    where: { companyId: actor.companyId, isActive: true, isDefault: true },
    include: { leaveType: { select: { id: true, name: true, grantAmount: true, isActive: true } } },
  }) ?? await prisma.leavePolicy.findFirst({
    where: { companyId: actor.companyId, isActive: true },
    include: { leaveType: { select: { id: true, name: true, grantAmount: true, isActive: true } } },
  });

  // 회사 내 재직자의 모든 정책 배정 (최신 effectiveDate 우선)
  const assignments = await prisma.leavePolicyAssignment.findMany({
    where: { employee: { companyId: actor.companyId, isActive: true } },
    include: {
      employee: { select: { id: true, name: true, hireDate: true } },
      policy: {
        include: {
          leaveType: {
            select: { id: true, name: true, grantAmount: true, isActive: true },
          },
        },
      },
    },
    orderBy: { effectiveDate: "desc" },
  });

  // (직원·휴가유형)별 최신 배정만 채택
  const latest = new Map<string, (typeof assignments)[number]>();
  for (const a of assignments) {
    const key = `${a.employeeId}:${a.policy.leaveTypeId}`;
    if (!latest.has(key)) latest.set(key, a);
  }

  // 미배정 구성원에게 기본 정책 적용
  const allActive = await prisma.employee.findMany({
    where: { companyId: actor.companyId, isActive: true },
    select: { id: true, name: true, hireDate: true },
  });
  const assignedIds = new Set(assignments.map((a) => a.employeeId));

  if (defaultPolicy) {
    for (const emp of allActive) {
      if (assignedIds.has(emp.id)) continue;
      const key = `${emp.id}:${defaultPolicy.leaveTypeId}`;
      if (latest.has(key)) continue;
      latest.set(key, {
        id: "",
        employeeId: emp.id,
        policyId: defaultPolicy.id,
        effectiveDate: new Date(),
        createdAt: new Date(),
        employee: emp,
        policy: defaultPolicy,
      } as (typeof assignments)[number]);
    }
  } else {
    // 정책이 전혀 없는 회사 → annual 타입으로 직접 부여 (법정 기본)
    const annualType = await prisma.leaveType.findFirst({
      where: { companyId: actor.companyId, key: "annual", isActive: true },
      select: { id: true, name: true, grantAmount: true, isActive: true },
    });
    if (annualType) {
      for (const emp of allActive) {
        const key = `${emp.id}:${annualType.id}`;
        if (latest.has(key)) continue;
        latest.set(key, {
          id: "",
          employeeId: emp.id,
          policyId: "",
          effectiveDate: new Date(),
          createdAt: new Date(),
          employee: emp,
          policy: {
            id: "",
            companyId: actor.companyId,
            name: "법정 기본",
            leaveTypeId: annualType.id,
            isActive: true,
            isDefault: false,
            decimalRule: "ROUND_UP_DAY" as DecimalRule,
            grantMode: "FISCAL_YEAR",
            fiscalStartMonth: 1,
            monthlyGrantRule: "MONTHLY_ON_ATTENDANCE",
            annualFirstYearRule: "PRORATED_ON_FIRST_FISCAL",
            expiryMonths: 12,
            carryoverMaxDays: null,
            useUnit: "HALF_DAY",
            hourUnitMinutes: null,
            overdraftEnabled: false,
            overdraftMaxDays: null,
            monthlyExpiryMode: "HIRE_DATE_1Y",
            monthlyGraceMonths: null,
            annualExpiryMode: "GRANT_DATE_1Y",
            annualGraceMonths: null,
            approverEmployeeId: null,
            ccEmployeeIds: [],
            approveOnRegister: true,
            approveOnCancel: false,
            smartPromotionEnabled: false,
            grantStartDate: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            leaveType: annualType,
          },
        } as (typeof assignments)[number]);
      }
    }
  }

  // 이미 부여된 (직원·휴가유형) 집합 — 멱등 검사
  const existing = await prisma.leaveTransaction.findMany({
    where: {
      category: "ANNUAL",
      txType: "GRANT",
      note: `${year}년 정기 부여`,
      employee: { companyId: actor.companyId },
    },
    select: { employeeId: true, leaveTypeId: true },
  });
  const grantedSet = new Set(
    existing.map((e) => `${e.employeeId}:${e.leaveTypeId}`),
  );

  const [totalActive] = await Promise.all([
    prisma.employee.count({
      where: { companyId: actor.companyId, isActive: true },
    }),
  ]);

  let grantedCount = 0;
  let grantedDays = 0;
  let alreadyGrantedCount = 0;
  let skippedNoAmountCount = 0;
  const now = new Date();

  for (const [key, a] of latest) {
    const { policy } = a;
    if (!policy.isActive || !policy.leaveType.isActive) {
      skippedNoAmountCount += 1;
      continue;
    }

    const hire = a.employee.hireDate;
    let days = 0;
    let grantNote = `${year}년 정기 부여`;

    if (policy.leaveType.grantAmount != null) {
      // 고정 부여 휴가 유형(연차 외) — 입사 연도 비례. 연 1회 멱등.
      if (grantedSet.has(key)) { alreadyGrantedCount += 1; continue; }
      days = entitledDays(Number(policy.leaveType.grantAmount), hire, year, policy.decimalRule);
    } else if (!hire) {
      // 입사일 미상 — 법정 기본 15일, 연 1회
      if (grantedSet.has(key)) { alreadyGrantedCount += 1; continue; }
      days = roundByRule(15, policy.decimalRule);
    } else {
      // 연차 — 입사일 기준 만 근속으로 몇 년차인지 판단해 부여
      const totalMonths = completedMonthsSinceHire(hire, now);
      if (totalMonths < 12) {
        // 1년 미만
        if (policy.monthlyGrantRule === "LUMP_SUM_ON_HIRE_11") {
          // 입사 시 11일 선부여 (연 1회)
          if (grantedSet.has(key)) { alreadyGrantedCount += 1; continue; }
          days = roundByRule(11, policy.decimalRule);
        } else if (policy.monthlyGrantRule === "LUMP_SUM_UNTIL_FISCAL") {
          // 입사일~회계일까지 월차 선부여 (비례, 연 1회)
          if (grantedSet.has(key)) { alreadyGrantedCount += 1; continue; }
          days = entitledDays(11, hire, year, policy.decimalRule);
        } else {
          // MONTHLY_ON_ATTENDANCE(기본) — 1개월 개근 시 +1, 최대 11. 누적 차액만.
          grantNote = "월 비례 부여";
          const target = Math.min(11, totalMonths);
          const prior = await prisma.leaveTransaction.aggregate({
            where: {
              employeeId: a.employeeId, leaveTypeId: policy.leaveTypeId,
              category: "ANNUAL", txType: "GRANT", note: { contains: "월 비례" },
            },
            _sum: { days: true },
          });
          const already = Number(prior._sum.days ?? 0);
          days = Math.max(0, target - already);
        }
      } else {
        // 1년 이상 — 근속 연수별 법정 일수(15·3년+2년마다+1·최대25), 연 1회
        if (grantedSet.has(key)) { alreadyGrantedCount += 1; continue; }
        days = roundByRule(legalAnnualDays(Math.floor(totalMonths / 12)), policy.decimalRule);
      }
    }

    if (days <= 0) {
      // 부여 대상 아님(입사 전·이번 달 추가분 없음)
      continue;
    }

    await prisma.$transaction([
      prisma.leaveTransaction.create({
        data: {
          employeeId: a.employeeId,
          leaveTypeId: policy.leaveTypeId,
          category: "ANNUAL",
          txType: "GRANT",
          days,
          reason: "연차 자동부여",
          note: grantNote,
          actorId: actorEmployeeId,
        },
      }),
      prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: a.employeeId,
            leaveTypeId: policy.leaveTypeId,
            year,
          },
        },
        create: {
          employeeId: a.employeeId,
          leaveTypeId: policy.leaveTypeId,
          year,
          grantedDays: days,
        },
        update: { grantedDays: { increment: days } },
      }),
    ]);

    grantedCount += 1;
    grantedDays += days;
  }

  const assignedEmployees = new Set(assignments.map((a) => a.employeeId));
  const noPolicyCount = defaultPolicy ? 0 : Math.max(0, totalActive - assignedEmployees.size);

  const result: AutoGrantResult = {
    year,
    grantedCount,
    grantedDays,
    alreadyGrantedCount,
    skippedNoAmountCount,
    noPolicyCount,
  };

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "leave",
    eventType: "CREATE",
    targetType: "LeaveAutoGrant",
    targetLabel: `${year}년 연차 자동부여`,
    description: `연차 자동부여 ${year}년 — ${grantedCount}명 ${grantedDays}일 부여 (이미 ${alreadyGrantedCount}명, 정책 미배정 ${noPolicyCount}명)`,
    afterSnapshot: result,
  });

  return ok(result);
}
