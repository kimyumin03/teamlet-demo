/**
 * 스마트 연차 촉진 엔진 (근로기준법 제61조)
 *
 * - 회계일/입사일 기준 법정 소멸일 계산
 * - 월차(1~9차 / 10~11차)·연차 촉진 LeavePromotion 자동 생성
 * - 이미 존재하는 촉진은 건너뜀 (멱등)
 */
import { prisma } from "@teamlet/db";
import type { LeavePromotionType } from "@teamlet/db";
import { createNotification } from "../notification/index";

export type PromotionRunResult = {
  companyId: string;
  created: number;
  skipped: number;
  errors: string[];
};

/** 회계연도 기준 소멸일: 회계 시작월 - 1일 = 전년도 말일 */
function fiscalYearExpiry(fiscalStartMonth: number, referenceYear: number): Date {
  // referenceYear의 연차는 다음 회계연도 시작 직전에 소멸
  // 예: 회계 1월 시작 → 연차 부여 1.1, 소멸 12.31
  const expiryYear = referenceYear;
  const expiryMonth = fiscalStartMonth - 1; // 0-indexed: 0=Jan
  if (expiryMonth === 0) {
    // fiscalStart=1 → expiry = Dec 31 of same year
    return new Date(Date.UTC(expiryYear, 11, 31));
  }
  // fiscalStart=4 → expiry = Mar 31 of same year (one day before Apr 1)
  return new Date(Date.UTC(expiryYear, expiryMonth - 1 + 1, 0));
}

/** 입사일 기준 월차 소멸일: hireDate + 1년 */
function monthlyLeaveExpiry(hireDate: Date): Date {
  return new Date(Date.UTC(hireDate.getUTCFullYear() + 1, hireDate.getUTCMonth(), hireDate.getUTCDate()));
}

/** 날짜 A에서 N개월 + D일 뺀 날짜 */
function subtractMonthsAndDays(date: Date, months: number, days: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() - months);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

function isSameOrBefore(a: Date, b: Date): boolean {
  return a.getTime() <= b.getTime();
}

/**
 * 단일 회사에 대해 스마트 촉진을 실행합니다.
 * 멱등 — 이미 생성된 촉진은 건너뜁니다.
 */
export async function runSmartPromotionForCompany(companyId: string): Promise<PromotionRunResult> {
  const result: PromotionRunResult = { companyId, created: 0, skipped: 0, errors: [] };

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      leaveSettings: true,
      leavePolicies: {
        where: { smartPromotionEnabled: true, isActive: true },
        include: { leaveType: true },
      },
    },
  });
  if (!company) return result;

  const settings = company.leaveSettings;
  if (!settings) return result; // 촉진 설정 없으면 스킵

  // smartPromotionEnabled된 정책 없으면 스킵
  if (company.leavePolicies.length === 0) return result;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const currentYear = today.getUTCFullYear();

  const activeEmployees = await prisma.employee.findMany({
    where: { companyId, employmentStatus: { not: "RESIGNED" } },
    select: { id: true, hireDate: true },
  });

  for (const policy of company.leavePolicies) {
    const isAnnual = policy.leaveType.key === "annual";
    const isMonthly = policy.leaveType.key === "monthly";

    for (const emp of activeEmployees) {
      if (!emp.hireDate) continue;

      const hireDate = emp.hireDate;
      const tenureMonths = Math.floor(
        (today.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
      );

      try {
        if (isAnnual && tenureMonths >= 12) {
          // ── 연차 촉진 ──
          const expiryDate =
            policy.grantMode === "FISCAL_YEAR"
              ? fiscalYearExpiry(policy.fiscalStartMonth, currentYear)
              : new Date(
                  Date.UTC(
                    hireDate.getUTCFullYear() + Math.floor(tenureMonths / 12) + 1,
                    hireDate.getUTCMonth(),
                    hireDate.getUTCDate(),
                  ),
                );

          const triggerDate = subtractMonthsAndDays(
            expiryDate,
            settings.annualPromotionMonthsBefore,
            settings.annualPromotionOffsetDays,
          );

          if (isSameOrBefore(triggerDate, today) && isSameOrBefore(today, expiryDate)) {
            await upsertPromotion(emp.id, companyId, currentYear, "ANNUAL", expiryDate, result);
          }
        } else if (isMonthly && tenureMonths < 12) {
          // ── 월차 촉진 ──
          const expiryDate = monthlyLeaveExpiry(hireDate);

          // 1차: 1~9번째 월차 (tenure < 9개월 남은 경우 포함)
          const trigger1 = subtractMonthsAndDays(
            expiryDate,
            settings.monthly1stPromotionMonthsBefore,
            settings.monthly1stPromotionOffsetDays,
          );
          if (isSameOrBefore(trigger1, today) && isSameOrBefore(today, expiryDate) && tenureMonths <= 9) {
            await upsertPromotion(emp.id, companyId, currentYear, "MONTHLY_1ST", expiryDate, result);
          }

          // 2차: 10~11번째 월차 (tenure >= 9개월)
          const trigger2 = subtractMonthsAndDays(
            expiryDate,
            settings.monthly2ndPromotionMonthsBefore,
            settings.monthly2ndPromotionOffsetDays,
          );
          if (isSameOrBefore(trigger2, today) && isSameOrBefore(today, expiryDate) && tenureMonths >= 9) {
            await upsertPromotion(emp.id, companyId, currentYear, "MONTHLY_2ND", expiryDate, result);
          }
        }
      } catch (e) {
        result.errors.push(`emp=${emp.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  return result;
}

async function upsertPromotion(
  employeeId: string,
  companyId: string,
  year: number,
  promotionType: LeavePromotionType,
  expiryDate: Date,
  result: PromotionRunResult,
) {
  const existing = await prisma.leavePromotion.findFirst({
    where: { employeeId, year, promotionType },
  });

  if (existing) {
    result.skipped++;
    return;
  }

  // 잔여 일수 스냅샷 (targetDays)
  const balance = await prisma.leaveBalance.findFirst({
    where: { employeeId, year, leaveType: { key: promotionType === "ANNUAL" ? "annual" : "monthly" } },
    select: { grantedDays: true, usedDays: true, adjustedDays: true },
  });
  const targetDays = balance
    ? Math.max(0, Number(balance.grantedDays) + Number(balance.adjustedDays) - Number(balance.usedDays))
    : 0;

  if (targetDays <= 0) {
    result.skipped++;
    return;
  }

  await prisma.leavePromotion.create({
    data: { employeeId, year, promotionType, targetDays, expiryDate, status: "REQUESTED" },
  });
  result.created++;

  // 구성원 알림 — 실패해도 촉진 생성은 보존
  try {
    const mm = expiryDate.getUTCMonth() + 1;
    const dd = expiryDate.getUTCDate();
    const typeLabel = promotionType === "ANNUAL" ? "연차" : "월차";
    const stageLabel = promotionType === "MONTHLY_2ND" ? " (2차)" : promotionType === "MONTHLY_1ST" ? " (1차)" : "";
    await createNotification({
      companyId,
      recipientEmployeeId: employeeId,
      category: "LEAVE",
      eventKey: `leave.promotion.${promotionType.toLowerCase()}`,
      title: `${typeLabel} 사용 촉진 요청${stageLabel}`,
      body: `소멸 예정 ${typeLabel} ${targetDays}일이 있어요. ${mm}월 ${dd}일까지 사용 계획을 제출해 주세요.`,
      deepLink: "/leave?tab=plan",
      relatedTargetType: "LeavePromotion",
    });
  } catch (e) {
    console.error(`[promotion-engine] 알림 발송 실패 emp=${employeeId}:`, e);
  }
}

/**
 * 전체 회사에 대해 스마트 촉진을 실행합니다. (worker cron 진입점)
 */
export async function runSmartPromotionAll(): Promise<PromotionRunResult[]> {
  const companies = await prisma.company.findMany({
    where: { isActive: true, leaveSettings: { memberRemindEnabled: true } },
    select: { id: true },
  });

  const results: PromotionRunResult[] = [];
  for (const c of companies) {
    const r = await runSmartPromotionForCompany(c.id);
    results.push(r);
  }
  return results;
}
