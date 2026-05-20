/**
 * 직책 도메인 (docs/03 §3 Position). P2 7-A — read + create + soft delete.
 *
 * 권한: `member.directory.read` / `member.directory.manage` (디렉토리와 동일 가드).
 * `isOrgHead` 는 DYNAMIC_ORG_HEAD 권한 평가에 사용 (P3+).
 *
 * PositionHistory(시점 이력) 는 P3 이후 — 현재는 Employee.positionId 한 컬럼.
 */

import { prisma } from "@teamlet/db";
import {
  err,
  errors,
  ok,
  positionCreateSchema,
  type PositionCreateInput,
  type Result,
} from "@teamlet/shared";
import { recordAudit } from "../audit/index";
import { catchDomainErr, loadActor } from "../permission/_actor";
import { assertPermission } from "../permission/assert";

const DIRECTORY_READ = "member.directory.read";
const DIRECTORY_MANAGE = "member.directory.manage";

export type PositionItem = {
  id: string;
  name: string;
  isOrgHead: boolean;
  sortOrder: number;
  isActive: boolean;
  memberCount: number;
};

export async function listPositions(
  actorEmployeeId: string,
): Promise<Result<PositionItem[]>> {
  try {
    await assertPermission(actorEmployeeId, DIRECTORY_READ);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const positions = await prisma.position.findMany({
    where: { companyId: actor.companyId, isActive: true },
    select: {
      id: true,
      name: true,
      isOrgHead: true,
      sortOrder: true,
      isActive: true,
      _count: { select: { employees: { where: { isActive: true } } } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return ok(
    positions.map((p) => ({
      id: p.id,
      name: p.name,
      isOrgHead: p.isOrgHead,
      sortOrder: p.sortOrder,
      isActive: p.isActive,
      memberCount: p._count.employees,
    })),
  );
}

export async function createPosition(
  actorEmployeeId: string,
  raw: PositionCreateInput,
): Promise<Result<{ positionId: string }>> {
  const parsed = positionCreateSchema.safeParse(raw);
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

  const dup = await prisma.position.findFirst({
    where: {
      companyId: actor.companyId,
      name: parsed.data.name,
      isActive: true,
    },
    select: { id: true },
  });
  if (dup) return err(errors.conflict("이미 같은 이름의 직책이 있어요"));

  const maxSibling = await prisma.position.aggregate({
    where: { companyId: actor.companyId },
    _max: { sortOrder: true },
  });
  const nextSortOrder = (maxSibling._max.sortOrder ?? -10) + 10;

  const pos = await prisma.position.create({
    data: {
      companyId: actor.companyId,
      name: parsed.data.name,
      isOrgHead: parsed.data.isOrgHead ?? false,
      sortOrder: nextSortOrder,
    },
  });

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "position",
    eventType: "CREATE",
    targetType: "Position",
    targetId: pos.id,
    targetLabel: pos.name,
    description: `직책 추가: ${pos.name}${pos.isOrgHead ? " (조직장)" : ""}`,
  });

  return ok({ positionId: pos.id });
}

/** 직책 삭제 (soft). 배정된 직원이 있으면 거절. */
export async function deletePosition(
  actorEmployeeId: string,
  positionId: string,
): Promise<Result<{ positionId: string }>> {
  try {
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const pos = await prisma.position.findUnique({
    where: { id: positionId },
    select: {
      id: true,
      name: true,
      companyId: true,
      isActive: true,
      _count: { select: { employees: { where: { isActive: true } } } },
    },
  });
  if (!pos || pos.companyId !== actor.companyId) {
    return err(errors.notFound("직책을 찾을 수 없어요"));
  }
  if (!pos.isActive) {
    return err(errors.conflict("이미 삭제된 직책이에요"));
  }
  if (pos._count.employees > 0) {
    return err(
      errors.conflict(
        "이 직책의 활성 구성원이 있어요. 먼저 다른 직책으로 옮겨 주세요.",
      ),
    );
  }

  await prisma.position.update({
    where: { id: positionId },
    data: { isActive: false },
  });

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "position",
    eventType: "DELETE",
    targetType: "Position",
    targetId: positionId,
    targetLabel: pos.name,
    description: `직책 삭제: ${pos.name}`,
  });

  return ok({ positionId });
}
