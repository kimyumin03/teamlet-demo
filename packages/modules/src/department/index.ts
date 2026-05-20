/**
 * 부서 도메인 (docs/02 §3 조직, docs/03 §3 Department).
 * P2 3-A: read 흐름 + 활성 멤버 카운트만. create/update/이동은 3-C.
 *
 * 권한: `member.directory.read` — 디렉토리와 동일 가드 (부서는 디렉토리 사이드바의 일부).
 */

import { prisma } from "@teamlet/db";
import {
  departmentCreateSchema,
  departmentUpdateSchema,
  err,
  errors,
  ok,
  type DepartmentCreateInput,
  type DepartmentUpdateInput,
  type Result,
} from "@teamlet/shared";
import { recordAudit } from "../audit/index";
import { catchDomainErr, loadActor } from "../permission/_actor";
import { assertPermission } from "../permission/assert";

const DIRECTORY_READ = "member.directory.read";
const DIRECTORY_MANAGE = "member.directory.manage";

/** 부서 평면 노드 — 트리 구성은 클라이언트 측에서 parentId 로 조립. */
export type DepartmentNode = {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  memberCount: number;
};

export async function listDepartments(
  actorEmployeeId: string,
): Promise<Result<DepartmentNode[]>> {
  try {
    await assertPermission(actorEmployeeId, DIRECTORY_READ);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const departments = await prisma.department.findMany({
    where: { companyId: actor.companyId, isActive: true },
    select: {
      id: true,
      name: true,
      parentId: true,
      sortOrder: true,
      isActive: true,
      _count: {
        select: {
          employees: { where: { isActive: true } },
        },
      },
    },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return ok(
    departments.map((d) => ({
      id: d.id,
      name: d.name,
      parentId: d.parentId,
      sortOrder: d.sortOrder,
      isActive: d.isActive,
      memberCount: d._count.employees,
    })),
  );
}

/** 부서 추가 — 같은 부모 아래 같은 이름 중복 차단. sortOrder 는 형제 중 max+10. */
export async function createDepartment(
  actorEmployeeId: string,
  raw: DepartmentCreateInput,
): Promise<Result<{ departmentId: string }>> {
  const parsed = departmentCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return err(
      errors.validation(parsed.error.issues[0]?.message ?? "입력 오류"),
    );
  }

  try {
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const parentId = parsed.data.parentId?.trim() || null;

  if (parentId) {
    const parent = await prisma.department.findUnique({
      where: { id: parentId },
      select: { companyId: true, isActive: true },
    });
    if (!parent || parent.companyId !== actor.companyId) {
      return err(errors.notFound("상위 부서를 찾을 수 없어요"));
    }
    if (!parent.isActive) {
      return err(errors.conflict("비활성 부서 아래에는 추가할 수 없어요"));
    }
  }

  // 같은 부모 아래 같은 이름 중복 — 친절한 메시지 (DB 에 unique 없음)
  const dup = await prisma.department.findFirst({
    where: {
      companyId: actor.companyId,
      parentId,
      name: parsed.data.name,
      isActive: true,
    },
    select: { id: true },
  });
  if (dup) {
    return err(errors.conflict("같은 위치에 같은 이름의 부서가 이미 있어요"));
  }

  // sortOrder: 형제 중 max+10 — 향후 수동 재정렬 여유
  const maxSibling = await prisma.department.aggregate({
    where: { companyId: actor.companyId, parentId },
    _max: { sortOrder: true },
  });
  const nextSortOrder = (maxSibling._max.sortOrder ?? -10) + 10;

  const dept = await prisma.department.create({
    data: {
      companyId: actor.companyId,
      parentId,
      name: parsed.data.name,
      sortOrder: nextSortOrder,
    },
  });

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "department",
    eventType: "CREATE",
    targetType: "Department",
    targetId: dept.id,
    targetLabel: dept.name,
    description: `부서 추가: ${dept.name}${parentId ? " (하위)" : ""}`,
  });

  return ok({ departmentId: dept.id });
}

/** 부서 이름 변경. 같은 부모 아래 중복 차단. */
export async function updateDepartment(
  actorEmployeeId: string,
  departmentId: string,
  raw: DepartmentUpdateInput,
): Promise<Result<{ departmentId: string }>> {
  const parsed = departmentUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return err(
      errors.validation(parsed.error.issues[0]?.message ?? "입력 오류"),
    );
  }

  try {
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const current = await prisma.department.findUnique({
    where: { id: departmentId },
    select: {
      id: true,
      name: true,
      parentId: true,
      companyId: true,
      isActive: true,
    },
  });
  if (!current || current.companyId !== actor.companyId) {
    return err(errors.notFound("부서를 찾을 수 없어요"));
  }
  if (!current.isActive) {
    return err(errors.conflict("비활성 부서는 수정할 수 없어요"));
  }

  if (parsed.data.name !== current.name) {
    const dup = await prisma.department.findFirst({
      where: {
        companyId: actor.companyId,
        parentId: current.parentId,
        name: parsed.data.name,
        isActive: true,
        NOT: { id: departmentId },
      },
      select: { id: true },
    });
    if (dup) {
      return err(
        errors.conflict("같은 위치에 같은 이름의 부서가 이미 있어요"),
      );
    }
  }

  const updated = await prisma.department.update({
    where: { id: departmentId },
    data: { name: parsed.data.name },
  });

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "department",
    eventType: "UPDATE",
    targetType: "Department",
    targetId: updated.id,
    targetLabel: updated.name,
    description: `부서 수정: ${current.name} → ${updated.name}`,
    beforeSnapshot: { name: current.name },
    afterSnapshot: { name: updated.name },
  });

  return ok({ departmentId });
}

/**
 * 부서 삭제 (soft — isActive=false). 활성 자식 부서 / 활성 직원 있으면 거절.
 * 직원은 별도로 다른 부서로 옮긴 뒤 삭제해야 함.
 */
export async function deleteDepartment(
  actorEmployeeId: string,
  departmentId: string,
): Promise<Result<{ departmentId: string }>> {
  try {
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const dept = await prisma.department.findUnique({
    where: { id: departmentId },
    select: {
      id: true,
      name: true,
      companyId: true,
      isActive: true,
      _count: {
        select: {
          children: { where: { isActive: true } },
          employees: { where: { isActive: true } },
        },
      },
    },
  });
  if (!dept || dept.companyId !== actor.companyId) {
    return err(errors.notFound("부서를 찾을 수 없어요"));
  }
  if (!dept.isActive) {
    return err(errors.conflict("이미 삭제된 부서예요"));
  }
  if (dept._count.children > 0) {
    return err(
      errors.conflict("하위 부서가 있어요. 먼저 정리해 주세요."),
    );
  }
  if (dept._count.employees > 0) {
    return err(
      errors.conflict(
        "이 부서에 배정된 구성원이 있어요. 먼저 다른 부서로 옮겨 주세요.",
      ),
    );
  }

  await prisma.department.update({
    where: { id: departmentId },
    data: { isActive: false },
  });

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "department",
    eventType: "DELETE",
    targetType: "Department",
    targetId: departmentId,
    targetLabel: dept.name,
    description: `부서 삭제: ${dept.name}`,
  });

  return ok({ departmentId });
}
