import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import type {
  LeaveGrantMethod,
  LeaveGrantUnit,
  LeavePaymentType,
  LeaveGenderRestriction,
  LeaveEvidenceRequirement,
  LeaveUseUnit,
} from "@teamlet/db";
import { catchDomainErr, loadActor } from "../permission/_actor";
import { assertPermission } from "../permission/assert";

const POLICY_MANAGE = "leave.policy.manage";

export type LeaveTypeFullItem = {
  id: string;
  key: string;
  name: string;
  description: string;
  isSystem: boolean;
  isRequired: boolean;
  isActive: boolean;
  grantMethod: LeaveGrantMethod;
  grantUnit: LeaveGrantUnit;
  grantAmount: number | null;
  paymentType: LeavePaymentType;
  partialPayPercent: number | null;
  genderRestriction: LeaveGenderRestriction;
  evidenceRequirement: LeaveEvidenceRequirement;
  useUnit: LeaveUseUnit;
  hourUnitMinutes: number | null;
  deductOnHoliday: boolean;
  periodicCycle: string | null;
  tenureYears: number | null;
  excludedEmploymentTypes: string[];
  approverEmployeeId: string | null;
  approverName: string | null;
  ccEmployeeIds: string[];
  sortOrder: number;
  policyCount: number;
};

export type LeaveTypeCreateInput = {
  name: string;
  key: string;
  description?: string;
  grantMethod?: LeaveGrantMethod;
  grantUnit?: LeaveGrantUnit;
  grantAmount?: number | null;
  paymentType?: LeavePaymentType;
  partialPayPercent?: number | null;
  genderRestriction?: LeaveGenderRestriction;
  evidenceRequirement?: LeaveEvidenceRequirement;
  useUnit?: LeaveUseUnit;
  hourUnitMinutes?: number | null;
  deductOnHoliday?: boolean;
  periodicCycle?: string | null;
  tenureYears?: number | null;
  excludedEmploymentTypes?: string[];
  approverEmployeeId?: string | null;
  ccEmployeeIds?: string[];
};

export type LeaveTypeUpdateInput = Partial<Omit<LeaveTypeCreateInput, "key">> & {
  isActive?: boolean;
  sortOrder?: number;
};

export async function listLeaveTypesFull(
  actorEmployeeId: string,
): Promise<Result<LeaveTypeFullItem[]>> {
  try {
    await assertPermission(actorEmployeeId, POLICY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const types = await prisma.leaveType.findMany({
    where: { companyId: actor.companyId },
    include: {
      _count: { select: { leavePolicies: true } },
      approver: { select: { name: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return ok(
    types.map((t) => ({
      id: t.id,
      key: t.key,
      name: t.name,
      description: t.description,
      isSystem: t.isSystem,
      isRequired: t.isRequired,
      isActive: t.isActive,
      grantMethod: t.grantMethod,
      grantUnit: t.grantUnit,
      grantAmount: t.grantAmount ? Number(t.grantAmount) : null,
      paymentType: t.paymentType,
      partialPayPercent: t.partialPayPercent,
      genderRestriction: t.genderRestriction,
      evidenceRequirement: t.evidenceRequirement,
      useUnit: t.useUnit,
      hourUnitMinutes: t.hourUnitMinutes,
      deductOnHoliday: t.deductOnHoliday,
      periodicCycle: t.periodicCycle,
      tenureYears: t.tenureYears,
      excludedEmploymentTypes: t.excludedEmploymentTypes,
      approverEmployeeId: t.approverEmployeeId,
      approverName: t.approver?.name ?? null,
      ccEmployeeIds: t.ccEmployeeIds,
      sortOrder: t.sortOrder,
      policyCount: t._count.leavePolicies,
    })),
  );
}

export async function createLeaveType(
  actorEmployeeId: string,
  input: LeaveTypeCreateInput,
): Promise<Result<{ id: string }>> {
  try {
    await assertPermission(actorEmployeeId, POLICY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  if (!input.name.trim()) return err(errors.validation("휴가 종류 이름을 입력해 주세요"));
  if (!input.key.trim()) return err(errors.validation("키(key)를 입력해 주세요"));

  const keyPattern = /^[a-z0-9_]+$/;
  if (!keyPattern.test(input.key)) return err(errors.validation("key는 소문자·숫자·밑줄(_)만 사용할 수 있어요"));

  const existing = await prisma.leaveType.findFirst({
    where: { companyId: actor.companyId, key: input.key },
  });
  if (existing) return err(errors.conflict("동일한 key의 휴가 종류가 이미 있어요"));

  const maxOrder = await prisma.leaveType.aggregate({
    where: { companyId: actor.companyId },
    _max: { sortOrder: true },
  });

  const leaveType = await prisma.leaveType.create({
    data: {
      companyId: actor.companyId,
      name: input.name.trim(),
      key: input.key.trim(),
      description: input.description?.trim() ?? "",
      grantMethod: input.grantMethod ?? "ON_REQUEST",
      grantUnit: input.grantUnit ?? "DAY",
      grantAmount: input.grantAmount ?? null,
      paymentType: input.paymentType ?? "PAID",
      partialPayPercent: input.partialPayPercent ?? null,
      genderRestriction: input.genderRestriction ?? "ALL",
      evidenceRequirement: input.evidenceRequirement ?? "NONE",
      useUnit: input.useUnit ?? "DAY",
      hourUnitMinutes: input.hourUnitMinutes ?? null,
      deductOnHoliday: input.deductOnHoliday ?? false,
      periodicCycle: input.periodicCycle ?? null,
      tenureYears: input.tenureYears ?? null,
      excludedEmploymentTypes: input.excludedEmploymentTypes ?? [],
      approverEmployeeId: input.approverEmployeeId ?? null,
      ccEmployeeIds: input.ccEmployeeIds ?? [],
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
    select: { id: true },
  });

  return ok(leaveType);
}

export async function updateLeaveType(
  actorEmployeeId: string,
  leaveTypeId: string,
  input: LeaveTypeUpdateInput,
): Promise<Result<void>> {
  try {
    await assertPermission(actorEmployeeId, POLICY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const leaveType = await prisma.leaveType.findFirst({
    where: { id: leaveTypeId, companyId: actor.companyId },
  });
  if (!leaveType) return err(errors.notFound("휴가 종류를 찾을 수 없어요"));

  await prisma.leaveType.update({
    where: { id: leaveTypeId },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.grantMethod !== undefined && { grantMethod: input.grantMethod }),
      ...(input.grantUnit !== undefined && { grantUnit: input.grantUnit }),
      ...(input.grantAmount !== undefined && { grantAmount: input.grantAmount }),
      ...(input.paymentType !== undefined && { paymentType: input.paymentType }),
      ...(input.partialPayPercent !== undefined && { partialPayPercent: input.partialPayPercent }),
      ...(input.genderRestriction !== undefined && { genderRestriction: input.genderRestriction }),
      ...(input.evidenceRequirement !== undefined && { evidenceRequirement: input.evidenceRequirement }),
      ...(input.useUnit !== undefined && { useUnit: input.useUnit }),
      ...(input.hourUnitMinutes !== undefined && { hourUnitMinutes: input.hourUnitMinutes }),
      ...(input.deductOnHoliday !== undefined && { deductOnHoliday: input.deductOnHoliday }),
      ...(input.periodicCycle !== undefined && { periodicCycle: input.periodicCycle }),
      ...(input.tenureYears !== undefined && { tenureYears: input.tenureYears }),
      ...(input.excludedEmploymentTypes !== undefined && { excludedEmploymentTypes: input.excludedEmploymentTypes }),
      ...(input.approverEmployeeId !== undefined && { approverEmployeeId: input.approverEmployeeId }),
      ...(input.ccEmployeeIds !== undefined && { ccEmployeeIds: input.ccEmployeeIds }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    },
  });

  return ok(undefined);
}

export async function deleteLeaveType(
  actorEmployeeId: string,
  leaveTypeId: string,
): Promise<Result<void>> {
  try {
    await assertPermission(actorEmployeeId, POLICY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const leaveType = await prisma.leaveType.findFirst({
    where: { id: leaveTypeId, companyId: actor.companyId },
    include: {
      _count: { select: { leaveBalances: true, leavePolicies: true } },
    },
  });
  if (!leaveType) return err(errors.notFound("휴가 종류를 찾을 수 없어요"));
  if (leaveType.isSystem || leaveType.isRequired) return err(errors.conflict("법정 필수 휴가는 삭제할 수 없어요. 비활성화만 가능해요."));
  if (leaveType._count.leaveBalances > 0) return err(errors.conflict("잔여 내역이 있는 휴가 종류는 삭제할 수 없어요."));
  if (leaveType._count.leavePolicies > 0) return err(errors.conflict("연결된 휴가 정책이 있어요. 정책을 먼저 삭제하세요."));

  await prisma.leaveType.delete({ where: { id: leaveTypeId } });
  return ok(undefined);
}
