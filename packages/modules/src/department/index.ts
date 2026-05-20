/**
 * 부서 도메인 (docs/02 §3 조직, docs/03 §3 Department).
 * P2 3-A: read 흐름 + 활성 멤버 카운트만. create/update/이동은 3-C.
 *
 * 권한: `member.directory.read` — 디렉토리와 동일 가드 (부서는 디렉토리 사이드바의 일부).
 */

import { prisma } from "@teamlet/db";
import {
  departmentCreateSchema,
  err,
  errors,
  ok,
  type DepartmentCreateInput,
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
