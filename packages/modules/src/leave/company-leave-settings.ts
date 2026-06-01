import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import type { RetirementAdjustMode } from "@teamlet/db";
import { catchDomainErr } from "../permission/_actor";
import { assertPermission } from "../permission/assert";

const POLICY_MANAGE = "leave.policy.manage";

export type CompanyLeaveSettingsItem = {
  id: string;
  retirementAdjustMode: RetirementAdjustMode;
  promotionApproverEmployeeId: string | null;
  promotionCcEmployeeIds: string[];
  memberRemindEnabled: boolean;
  adminRemindEnabled: boolean;
  planNoticeDaysBefore: number;
  annualPromotionMonthsBefore: number;
  annualPromotionOffsetDays: number;
  monthly1stPromotionMonthsBefore: number;
  monthly1stPromotionOffsetDays: number;
  monthly2ndPromotionMonthsBefore: number;
  monthly2ndPromotionOffsetDays: number;
};

export type CompanyLeaveSettingsUpdateInput = {
  retirementAdjustMode?: RetirementAdjustMode;
  promotionApproverEmployeeId?: string | null;
  promotionCcEmployeeIds?: string[];
  memberRemindEnabled?: boolean;
  adminRemindEnabled?: boolean;
  planNoticeDaysBefore?: number;
  annualPromotionMonthsBefore?: number;
  annualPromotionOffsetDays?: number;
  monthly1stPromotionMonthsBefore?: number;
  monthly1stPromotionOffsetDays?: number;
  monthly2ndPromotionMonthsBefore?: number;
  monthly2ndPromotionOffsetDays?: number;
};

export async function getCompanyLeaveSettings(
  actorEmployeeId: string,
): Promise<Result<CompanyLeaveSettingsItem>> {
  try {
    await assertPermission(actorEmployeeId, POLICY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const settings = await prisma.companyLeaveSettings.upsert({
    where: { companyId: emp.companyId },
    create: { companyId: emp.companyId },
    update: {},
  });

  return ok({
    id: settings.id,
    retirementAdjustMode: settings.retirementAdjustMode,
    promotionApproverEmployeeId: settings.promotionApproverEmployeeId,
    promotionCcEmployeeIds: settings.promotionCcEmployeeIds,
    memberRemindEnabled: settings.memberRemindEnabled,
    adminRemindEnabled: settings.adminRemindEnabled,
    planNoticeDaysBefore: settings.planNoticeDaysBefore,
    annualPromotionMonthsBefore: settings.annualPromotionMonthsBefore,
    annualPromotionOffsetDays: settings.annualPromotionOffsetDays,
    monthly1stPromotionMonthsBefore: settings.monthly1stPromotionMonthsBefore,
    monthly1stPromotionOffsetDays: settings.monthly1stPromotionOffsetDays,
    monthly2ndPromotionMonthsBefore: settings.monthly2ndPromotionMonthsBefore,
    monthly2ndPromotionOffsetDays: settings.monthly2ndPromotionOffsetDays,
  });
}

export async function updateCompanyLeaveSettings(
  actorEmployeeId: string,
  input: CompanyLeaveSettingsUpdateInput,
): Promise<Result<void>> {
  try {
    await assertPermission(actorEmployeeId, POLICY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  await prisma.companyLeaveSettings.upsert({
    where: { companyId: emp.companyId },
    create: {
      companyId: emp.companyId,
      ...input,
      promotionCcEmployeeIds: input.promotionCcEmployeeIds ?? [],
    },
    update: {
      ...(input.retirementAdjustMode !== undefined && { retirementAdjustMode: input.retirementAdjustMode }),
      ...(input.promotionApproverEmployeeId !== undefined && { promotionApproverEmployeeId: input.promotionApproverEmployeeId }),
      ...(input.promotionCcEmployeeIds !== undefined && { promotionCcEmployeeIds: input.promotionCcEmployeeIds }),
      ...(input.memberRemindEnabled !== undefined && { memberRemindEnabled: input.memberRemindEnabled }),
      ...(input.adminRemindEnabled !== undefined && { adminRemindEnabled: input.adminRemindEnabled }),
      ...(input.planNoticeDaysBefore !== undefined && { planNoticeDaysBefore: input.planNoticeDaysBefore }),
      ...(input.annualPromotionMonthsBefore !== undefined && { annualPromotionMonthsBefore: input.annualPromotionMonthsBefore }),
      ...(input.annualPromotionOffsetDays !== undefined && { annualPromotionOffsetDays: input.annualPromotionOffsetDays }),
      ...(input.monthly1stPromotionMonthsBefore !== undefined && { monthly1stPromotionMonthsBefore: input.monthly1stPromotionMonthsBefore }),
      ...(input.monthly1stPromotionOffsetDays !== undefined && { monthly1stPromotionOffsetDays: input.monthly1stPromotionOffsetDays }),
      ...(input.monthly2ndPromotionMonthsBefore !== undefined && { monthly2ndPromotionMonthsBefore: input.monthly2ndPromotionMonthsBefore }),
      ...(input.monthly2ndPromotionOffsetDays !== undefined && { monthly2ndPromotionOffsetDays: input.monthly2ndPromotionOffsetDays }),
    },
  });

  return ok(undefined);
}
