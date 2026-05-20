/**
 * 부서 도메인 (docs/02 §3 조직, docs/03 §3 Department).
 * P2 3-A: read 흐름 + 활성 멤버 카운트만. create/update/이동은 3-C.
 *
 * 권한: `member.directory.read` — 디렉토리와 동일 가드 (부서는 디렉토리 사이드바의 일부).
 */

import { prisma } from "@teamlet/db";
import { err, errors, ok, type Result } from "@teamlet/shared";
import { catchDomainErr, loadActor } from "../permission/_actor";
import { assertPermission } from "../permission/assert";

const DIRECTORY_READ = "member.directory.read";

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
