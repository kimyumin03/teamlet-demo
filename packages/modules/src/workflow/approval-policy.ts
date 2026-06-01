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

/**
 * 결재 정책 기반 자동 결재선 해석 (C7).
 * 기안자(authorId)의 부서·회사 컨텍스트로 해당 kind 의 활성 정책 step 들을
 * 실제 결재자 employeeId 순서 배열로 변환한다.
 *
 * 해석 규칙:
 * - SPECIFIC_PERSON  → step.approverId (회사 소속·재직 검증)
 * - DEPARTMENT_HEAD  → 기안자 부서의 isOrgHead 직책 보유 재직자
 * - ORG_HEAD         → 기안자 부서 트리 최상위(root) 부서의 isOrgHead 재직자
 * - DIRECT_MANAGER   → 직속상사 데이터 모델 부재 → DEPARTMENT_HEAD 로 대체 (한계)
 *
 * 활성 정책이 없으면 ok(null) — 호출부가 수동 결재자로 폴백.
 * 정책은 있으나 해석 실패 시 err(검증 메시지).
 */
export async function resolveApprovalSteps(
  companyId: string,
  authorId: string,
  kind: FormDocumentKind,
): Promise<Result<string[] | null>> {
  const policy = await prisma.approvalPolicy.findFirst({
    where: { companyId, category: kind, isActive: true },
    include: { steps: { orderBy: { step: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  if (!policy || policy.steps.length === 0) return ok(null);

  const author = await prisma.employee.findFirst({
    where: { id: authorId, companyId },
    select: { id: true, departmentId: true },
  });
  if (!author) return err(errors.notFound("기안자 정보를 찾을 수 없어요"));

  // 부서장 해석 헬퍼: 특정 부서의 isOrgHead 재직자 (sortOrder→name 결정적 선택)
  const findDeptHead = async (departmentId: string | null): Promise<string | null> => {
    if (!departmentId) return null;
    const head = await prisma.employee.findFirst({
      where: {
        companyId,
        departmentId,
        isActive: true,
        employmentStatus: "ACTIVE",
        position: { isOrgHead: true },
      },
      orderBy: [{ position: { sortOrder: "asc" } }, { name: "asc" }],
      select: { id: true },
    });
    return head?.id ?? null;
  };

  // 부서 트리 최상위 부서 id 해석 (순환 방지: 방문 집합)
  const findRootDeptId = async (departmentId: string | null): Promise<string | null> => {
    if (!departmentId) return null;
    const depts = await prisma.department.findMany({
      where: { companyId },
      select: { id: true, parentId: true },
    });
    const parentOf = new Map(depts.map((d) => [d.id, d.parentId]));
    let current: string | null = departmentId;
    const seen = new Set<string>();
    while (current && parentOf.get(current) && !seen.has(current)) {
      seen.add(current);
      current = parentOf.get(current) ?? null;
    }
    return current;
  };

  const resolved: string[] = [];
  for (const s of policy.steps) {
    let approverId: string | null = null;
    const type = s.approverType as ApproverType;

    if (type === "SPECIFIC_PERSON") {
      if (!s.approverId) return err(errors.validation(`결재 정책 ${s.step}단계에 지정 결재자가 없어요`));
      const exists = await prisma.employee.count({
        where: { id: s.approverId, companyId, isActive: true },
      });
      if (exists === 0) return err(errors.validation(`결재 정책 ${s.step}단계 결재자가 더 이상 재직하지 않아요`));
      approverId = s.approverId;
    } else if (type === "DEPARTMENT_HEAD" || type === "DIRECT_MANAGER") {
      approverId = await findDeptHead(author.departmentId);
      if (!approverId)
        return err(errors.validation(`결재 정책 ${s.step}단계: 기안자 부서의 부서장을 찾을 수 없어요`));
    } else if (type === "ORG_HEAD") {
      const rootId = await findRootDeptId(author.departmentId);
      approverId = await findDeptHead(rootId);
      if (!approverId)
        return err(errors.validation(`결재 정책 ${s.step}단계: 조직 책임자를 찾을 수 없어요`));
    }

    if (!approverId) return err(errors.validation(`결재 정책 ${s.step}단계를 해석할 수 없어요`));
    // 기안자 본인·연속 중복 결재자 제거 (의미 없는 자기결재/중복 단계 방지)
    if (approverId === author.id) continue;
    if (resolved.includes(approverId)) continue;
    resolved.push(approverId);
  }

  if (resolved.length === 0)
    return err(errors.validation("결재 정책으로 유효한 결재자를 만들 수 없어요"));
  return ok(resolved);
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
