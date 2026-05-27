import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { assertPermission } from "../permission/assert";
import { catchDomainErr, loadActor } from "../permission/_actor";
import type { FormDocumentKind } from "./types";

const POLICY_MANAGE = "workflow.template.manage";

export type ApproverType = "SPECIFIC_PERSON" | "DIRECT_MANAGER" | "DEPARTMENT_HEAD" | "ORG_HEAD";

export type ApprovalPolicyStep = {
  step: number;
  approverType: ApproverType;
  approverId: string | null;
  approverName?: string | null;
};

export type ApprovalPolicyItem = {
  id: string;
  name: string;
  category: FormDocumentKind;
  description: string;
  isActive: boolean;
  steps: ApprovalPolicyStep[];
  createdAt: Date;
};

export type ApprovalPolicyCreateInput = {
  name: string;
  category?: FormDocumentKind;
  description?: string;
  steps: { approverType: ApproverType; approverId?: string }[];
};

export type ApprovalPolicyUpdateInput = Partial<Omit<ApprovalPolicyCreateInput, "category">> & { isActive?: boolean };

export async function listApprovalPolicies(
  actorEmployeeId: string,
): Promise<Result<ApprovalPolicyItem[]>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const policies = await prisma.approvalPolicy.findMany({
    where: { companyId: actor.companyId },
    include: {
      steps: {
        include: { policy: false },
        orderBy: { step: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // approver names via separate query for SPECIFIC_PERSON steps
  const specificIds = policies
    .flatMap((p) => p.steps)
    .filter((s) => s.approverId)
    .map((s) => s.approverId as string);

  const employees =
    specificIds.length > 0
      ? await prisma.employee.findMany({
          where: { id: { in: specificIds } },
          select: { id: true, name: true },
        })
      : [];
  const empMap = new Map(employees.map((e) => [e.id, e.name]));

  return ok(
    policies.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category as FormDocumentKind,
      description: p.description,
      isActive: p.isActive,
      createdAt: p.createdAt,
      steps: p.steps.map((s) => ({
        step: s.step,
        approverType: s.approverType as ApproverType,
        approverId: s.approverId,
        approverName: s.approverId ? (empMap.get(s.approverId) ?? null) : null,
      })),
    })),
  );
}

export async function createApprovalPolicy(
  actorEmployeeId: string,
  input: ApprovalPolicyCreateInput,
): Promise<Result<{ id: string }>> {
  try {
    await assertPermission(actorEmployeeId, POLICY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  if (!input.name.trim()) return err(errors.validation("정책 이름을 입력해 주세요"));
  if (input.steps.length === 0) return err(errors.validation("결재 단계를 하나 이상 추가해 주세요"));

  const policy = await prisma.approvalPolicy.create({
    data: {
      companyId: actor.companyId,
      name: input.name.trim(),
      category: input.category ?? "GENERAL",
      description: input.description?.trim() ?? "",
      steps: {
        create: input.steps.map((s, i) => ({
          step: i + 1,
          approverType: s.approverType,
          approverId: s.approverId ?? null,
        })),
      },
    },
    select: { id: true },
  });

  return ok(policy);
}

export async function updateApprovalPolicy(
  actorEmployeeId: string,
  policyId: string,
  input: ApprovalPolicyUpdateInput,
): Promise<Result<void>> {
  try {
    await assertPermission(actorEmployeeId, POLICY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const policy = await prisma.approvalPolicy.findFirst({
    where: { id: policyId, companyId: actor.companyId },
  });
  if (!policy) return err(errors.notFound("정책을 찾을 수 없어요"));

  await prisma.$transaction(async (tx) => {
    await tx.approvalPolicy.update({
      where: { id: policyId },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.description !== undefined && { description: input.description.trim() }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });

    if (input.steps) {
      await tx.approvalPolicyStep.deleteMany({ where: { policyId } });
      await tx.approvalPolicyStep.createMany({
        data: input.steps.map((s, i) => ({
          policyId,
          step: i + 1,
          approverType: s.approverType,
          approverId: s.approverId ?? null,
        })),
      });
    }
  });

  return ok(undefined);
}

export async function deleteApprovalPolicy(
  actorEmployeeId: string,
  policyId: string,
): Promise<Result<void>> {
  try {
    await assertPermission(actorEmployeeId, POLICY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const policy = await prisma.approvalPolicy.findFirst({
    where: { id: policyId, companyId: actor.companyId },
  });
  if (!policy) return err(errors.notFound("정책을 찾을 수 없어요"));

  await prisma.approvalPolicy.delete({ where: { id: policyId } });
  return ok(undefined);
}
