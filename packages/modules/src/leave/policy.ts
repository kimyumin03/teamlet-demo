import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import type {
  LeavePolicyGrantMode,
  MonthlyGrantRule,
  AnnualFirstYearRule,
  DecimalRule,
  LeaveUseUnit,
  MonthlyExpiryMode,
  AnnualExpiryMode,
} from "@teamlet/db";
import { catchDomainErr } from "../permission/_actor";
import { assertPermission } from "../permission/assert";

const POLICY_READ = "leave.policy.read";
const POLICY_MANAGE = "leave.policy.manage";

export type LeavePolicyItem = {
  id: string;
  name: string;
  leaveTypeId: string;
  leaveTypeName: string;
  grantMode: LeavePolicyGrantMode;
  fiscalStartMonth: number;
  monthlyGrantRule: MonthlyGrantRule;
  annualFirstYearRule: AnnualFirstYearRule;
  decimalRule: DecimalRule;
  expiryMonths: number;
  carryoverMaxDays: number | null;
  useUnit: LeaveUseUnit;
  hourUnitMinutes: number | null;
  overdraftEnabled: boolean;
  overdraftMaxDays: number | null;
  monthlyExpiryMode: MonthlyExpiryMode;
  monthlyGraceMonths: number | null;
  annualExpiryMode: AnnualExpiryMode;
  annualGraceMonths: number | null;
  approverEmployeeId: string | null;
  ccEmployeeIds: string[];
  approveOnRegister: boolean;
  approveOnCancel: boolean;
  smartPromotionEnabled: boolean;
  isDefault: boolean;
  isActive: boolean;
  assignedCount: number;
};

export type LeavePolicyCreateInput = {
  name: string;
  leaveTypeId: string;
  grantMode?: LeavePolicyGrantMode;
  fiscalStartMonth?: number;
  monthlyGrantRule?: MonthlyGrantRule;
  annualFirstYearRule?: AnnualFirstYearRule;
  decimalRule?: DecimalRule;
  expiryMonths?: number;
  carryoverMaxDays?: number | null;
  useUnit?: LeaveUseUnit;
  hourUnitMinutes?: number | null;
  overdraftEnabled?: boolean;
  overdraftMaxDays?: number | null;
  monthlyExpiryMode?: MonthlyExpiryMode;
  monthlyGraceMonths?: number | null;
  annualExpiryMode?: AnnualExpiryMode;
  annualGraceMonths?: number | null;
  approverEmployeeId?: string | null;
  ccEmployeeIds?: string[];
  approveOnRegister?: boolean;
  approveOnCancel?: boolean;
  smartPromotionEnabled?: boolean;
  isDefault?: boolean;
  isActive?: boolean;
};

export type LeavePolicyUpdateInput = Partial<Omit<LeavePolicyCreateInput, "leaveTypeId">>;

export async function listLeavePolicies(
  actorEmployeeId: string,
): Promise<Result<LeavePolicyItem[]>> {
  try {
    await assertPermission(actorEmployeeId, POLICY_READ);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const policies = await prisma.leavePolicy.findMany({
    where: { companyId: emp.companyId },
    include: {
      leaveType: { select: { name: true } },
      _count: { select: { assignments: true } },
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return ok(
    policies.map((p) => ({
      id: p.id,
      name: p.name,
      leaveTypeId: p.leaveTypeId,
      leaveTypeName: p.leaveType.name,
      grantMode: p.grantMode,
      fiscalStartMonth: p.fiscalStartMonth,
      monthlyGrantRule: p.monthlyGrantRule,
      annualFirstYearRule: p.annualFirstYearRule,
      decimalRule: p.decimalRule,
      expiryMonths: p.expiryMonths,
      carryoverMaxDays: p.carryoverMaxDays ? Number(p.carryoverMaxDays) : null,
      useUnit: p.useUnit,
      hourUnitMinutes: p.hourUnitMinutes,
      overdraftEnabled: p.overdraftEnabled,
      overdraftMaxDays: p.overdraftMaxDays,
      monthlyExpiryMode: p.monthlyExpiryMode,
      monthlyGraceMonths: p.monthlyGraceMonths,
      annualExpiryMode: p.annualExpiryMode,
      annualGraceMonths: p.annualGraceMonths,
      approverEmployeeId: p.approverEmployeeId,
      ccEmployeeIds: p.ccEmployeeIds,
      approveOnRegister: p.approveOnRegister,
      approveOnCancel: p.approveOnCancel,
      smartPromotionEnabled: p.smartPromotionEnabled,
      isDefault: p.isDefault,
      isActive: p.isActive,
      assignedCount: p._count.assignments,
    })),
  );
}

export async function createLeavePolicy(
  actorEmployeeId: string,
  input: LeavePolicyCreateInput,
): Promise<Result<{ id: string }>> {
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

  const leaveType = await prisma.leaveType.findFirst({
    where: { id: input.leaveTypeId, companyId: emp.companyId },
  });
  if (!leaveType) return err(errors.notFound("휴가 유형을 찾을 수 없어요"));

  const policy = await prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.leavePolicy.updateMany({
        where: { companyId: emp.companyId, leaveTypeId: input.leaveTypeId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.leavePolicy.create({
      data: {
        companyId: emp.companyId,
        name: input.name,
        leaveTypeId: input.leaveTypeId,
        grantMode: input.grantMode ?? "FISCAL_YEAR",
        fiscalStartMonth: input.fiscalStartMonth ?? 1,
        monthlyGrantRule: input.monthlyGrantRule ?? "MONTHLY_ON_ATTENDANCE",
        annualFirstYearRule: input.annualFirstYearRule ?? "PRORATED_ON_FIRST_FISCAL",
        decimalRule: input.decimalRule ?? "ROUND_UP_DAY",
        expiryMonths: input.expiryMonths ?? 12,
        carryoverMaxDays: input.carryoverMaxDays ?? null,
        useUnit: input.useUnit ?? "HALF_DAY",
        hourUnitMinutes: input.hourUnitMinutes ?? null,
        overdraftEnabled: input.overdraftEnabled ?? false,
        overdraftMaxDays: input.overdraftMaxDays ?? null,
        monthlyExpiryMode: input.monthlyExpiryMode ?? "HIRE_DATE_1Y",
        monthlyGraceMonths: input.monthlyGraceMonths ?? null,
        annualExpiryMode: input.annualExpiryMode ?? "GRANT_DATE_1Y",
        annualGraceMonths: input.annualGraceMonths ?? null,
        approverEmployeeId: input.approverEmployeeId ?? null,
        ccEmployeeIds: input.ccEmployeeIds ?? [],
        approveOnRegister: input.approveOnRegister ?? true,
        approveOnCancel: input.approveOnCancel ?? false,
        smartPromotionEnabled: input.smartPromotionEnabled ?? false,
        isDefault: input.isDefault ?? false,
      },
    });
  });

  return ok({ id: policy.id });
}

export async function updateLeavePolicy(
  actorEmployeeId: string,
  policyId: string,
  input: LeavePolicyUpdateInput,
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

  const policy = await prisma.leavePolicy.findFirst({
    where: { id: policyId, companyId: emp.companyId },
  });
  if (!policy) return err(errors.notFound("정책을 찾을 수 없어요"));

  await prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.leavePolicy.updateMany({
        where: { companyId: emp.companyId, leaveTypeId: policy.leaveTypeId, isDefault: true, id: { not: policyId } },
        data: { isDefault: false },
      });
    }
    await tx.leavePolicy.update({
      where: { id: policyId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.grantMode !== undefined && { grantMode: input.grantMode }),
        ...(input.fiscalStartMonth !== undefined && { fiscalStartMonth: input.fiscalStartMonth }),
        ...(input.monthlyGrantRule !== undefined && { monthlyGrantRule: input.monthlyGrantRule }),
        ...(input.annualFirstYearRule !== undefined && { annualFirstYearRule: input.annualFirstYearRule }),
        ...(input.decimalRule !== undefined && { decimalRule: input.decimalRule }),
        ...(input.expiryMonths !== undefined && { expiryMonths: input.expiryMonths }),
        ...(input.carryoverMaxDays !== undefined && { carryoverMaxDays: input.carryoverMaxDays }),
        ...(input.useUnit !== undefined && { useUnit: input.useUnit }),
        ...(input.hourUnitMinutes !== undefined && { hourUnitMinutes: input.hourUnitMinutes }),
        ...(input.overdraftEnabled !== undefined && { overdraftEnabled: input.overdraftEnabled }),
        ...(input.overdraftMaxDays !== undefined && { overdraftMaxDays: input.overdraftMaxDays }),
        ...(input.monthlyExpiryMode !== undefined && { monthlyExpiryMode: input.monthlyExpiryMode }),
        ...(input.monthlyGraceMonths !== undefined && { monthlyGraceMonths: input.monthlyGraceMonths }),
        ...(input.annualExpiryMode !== undefined && { annualExpiryMode: input.annualExpiryMode }),
        ...(input.annualGraceMonths !== undefined && { annualGraceMonths: input.annualGraceMonths }),
        ...(input.approverEmployeeId !== undefined && { approverEmployeeId: input.approverEmployeeId }),
        ...(input.ccEmployeeIds !== undefined && { ccEmployeeIds: input.ccEmployeeIds }),
        ...(input.approveOnRegister !== undefined && { approveOnRegister: input.approveOnRegister }),
        ...(input.approveOnCancel !== undefined && { approveOnCancel: input.approveOnCancel }),
        ...(input.smartPromotionEnabled !== undefined && { smartPromotionEnabled: input.smartPromotionEnabled }),
        ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
  });

  return ok(undefined);
}

export async function deleteLeavePolicy(
  actorEmployeeId: string,
  policyId: string,
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

  const policy = await prisma.leavePolicy.findFirst({
    where: { id: policyId, companyId: emp.companyId },
    include: { _count: { select: { assignments: true } } },
  });
  if (!policy) return err(errors.notFound("정책을 찾을 수 없어요"));
  if (policy._count.assignments > 0)
    return err(errors.conflict("배정된 직원이 있어 삭제할 수 없어요. 먼저 배정을 해제하세요."));

  await prisma.leavePolicy.delete({ where: { id: policyId } });
  return ok(undefined);
}

export type PolicyAssignmentItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string | null;
  effectiveDate: Date;
};

export async function listPolicyAssignments(
  actorEmployeeId: string,
  policyId: string,
): Promise<Result<PolicyAssignmentItem[]>> {
  try {
    await assertPermission(actorEmployeeId, POLICY_READ);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const policy = await prisma.leavePolicy.findFirst({
    where: { id: policyId, companyId: emp.companyId },
  });
  if (!policy) return err(errors.notFound("정책을 찾을 수 없어요"));

  const assignments = await prisma.leavePolicyAssignment.findMany({
    where: { policyId },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return ok(
    assignments.map((a) => ({
      id: a.id,
      employeeId: a.employeeId,
      employeeName: a.employee.name,
      departmentName: a.employee.department?.name ?? null,
      effectiveDate: a.effectiveDate,
    })),
  );
}

export async function assignLeavePolicy(
  actorEmployeeId: string,
  policyId: string,
  targetEmployeeId: string,
  effectiveDate: string,
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

  const [policy, target] = await Promise.all([
    prisma.leavePolicy.findFirst({ where: { id: policyId, companyId: emp.companyId } }),
    prisma.employee.findFirst({ where: { id: targetEmployeeId, companyId: emp.companyId } }),
  ]);
  if (!policy) return err(errors.notFound("정책을 찾을 수 없어요"));
  if (!target) return err(errors.notFound("직원을 찾을 수 없어요"));

  await prisma.leavePolicyAssignment.create({
    data: {
      employeeId: targetEmployeeId,
      policyId,
      effectiveDate: new Date(effectiveDate),
    },
  });

  return ok(undefined);
}

export async function removeLeavePolicy(
  actorEmployeeId: string,
  assignmentId: string,
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

  const assignment = await prisma.leavePolicyAssignment.findFirst({
    where: { id: assignmentId },
    include: { policy: { select: { companyId: true } } },
  });
  if (!assignment || assignment.policy.companyId !== emp.companyId)
    return err(errors.notFound("배정 정보를 찾을 수 없어요"));

  await prisma.leavePolicyAssignment.delete({ where: { id: assignmentId } });
  return ok(undefined);
}

/** 권한 없이 내 연차 정책의 승인자 정보 조회 (내 휴가 페이지용).
 *  직원별 배정 정책 우선, 없으면 회사 기본 정책, 없으면 null. */
export async function getMyAnnualPolicyApprover(
  employeeId: string,
): Promise<{ approverId: string | null; approverName: string | null; approveOnRegister: boolean }> {
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true },
  });
  if (!emp) return { approverId: null, approverName: null, approveOnRegister: true };

  const SELECT = {
    approverEmployeeId: true,
    approveOnRegister: true,
    approver: { select: { name: true } },
  } as const;

  // 직원에게 배정된 연차 정책 우선 조회
  const assignment = await prisma.leavePolicyAssignment.findFirst({
    where: {
      employeeId,
      policy: { companyId: emp.companyId, isActive: true, leaveType: { key: "annual" } },
    },
    orderBy: { effectiveDate: "desc" },
    select: { policy: { select: SELECT } },
  });

  const policy = assignment?.policy ?? (
    await prisma.leavePolicy.findFirst({
      where: { companyId: emp.companyId, isActive: true, isDefault: true, leaveType: { key: "annual" } },
      select: SELECT,
    }) ?? await prisma.leavePolicy.findFirst({
      where: { companyId: emp.companyId, isActive: true, leaveType: { key: "annual" } },
      select: SELECT,
    })
  );

  return {
    approverId: policy?.approverEmployeeId ?? null,
    approverName: policy?.approver?.name ?? null,
    approveOnRegister: policy?.approveOnRegister ?? true,
  };
}
