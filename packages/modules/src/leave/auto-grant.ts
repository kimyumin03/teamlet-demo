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
 * 부여 일수 계산. 입사 연도 직원은 월할 비례, 그 외는 전액.
 * hireDate 가 부여 연도보다 미래면 0 (아직 입사 전).
 */
function entitledDays(
  base: number,
  hireDate: Date | null,
  year: number,
  rule: DecimalRule,
): number {
  if (!hireDate) return roundByRule(base, rule);
  const hireYear = hireDate.getUTCFullYear();
  if (hireYear > year) return 0;
  if (hireYear < year) return roundByRule(base, rule);
  // 입사 연도 — 입사월(0-11)부터 연말까지 개월수로 비례
  const monthsWorked = 12 - hireDate.getUTCMonth();
  return roundByRule((base * monthsWorked) / 12, rule);
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

  for (const [key, a] of latest) {
    const { policy } = a;
    if (!policy.isActive || !policy.leaveType.isActive) {
      skippedNoAmountCount += 1;
      continue;
    }

    const base = policy.leaveType.grantAmount
      ? Number(policy.leaveType.grantAmount)
      : 0;
    if (base <= 0) {
      skippedNoAmountCount += 1;
      continue;
    }

    if (grantedSet.has(key)) {
      alreadyGrantedCount += 1;
      continue;
    }

    const days = entitledDays(
      base,
      a.employee.hireDate,
      year,
      policy.decimalRule,
    );
    if (days <= 0) {
      // 아직 입사 전 — 부여 대상 아님
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
          note: `${year}년 정기 부여`,
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
  const noPolicyCount = Math.max(0, totalActive - assignedEmployees.size);

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
