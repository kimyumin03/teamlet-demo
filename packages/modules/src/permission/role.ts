/**
 * 역할 CRUD (docs/02 §11-1, docs/03 §7).
 * 모든 변경은 `permission.role.manage` 가드 + audit 기록.
 *
 * 시스템 역할(SYSTEM_SUPER_ADMIN / DYNAMIC_ORG_HEAD / isSystem) 은 수정/삭제 불가.
 * 락아웃 방지(마지막 SUPER_ADMIN 박탈 차단) 는 별도 단계 — 여기선 시스템 역할 자체 보호만.
 */

import { prisma } from "@teamlet/db";
import type { RoleType } from "@teamlet/db";
import {
  err,
  errors,
  ok,
  roleCreateSchema,
  roleUpdateSchema,
  type Result,
  type RoleCreateInput,
  type RoleUpdateInput,
} from "@teamlet/shared";
import { recordAudit } from "../audit/index";
import { catchDomainErr, loadActor } from "./_actor";
import { assertPermission } from "./assert";

const ROLE_MANAGE = "permission.role.manage";
const ROLE_READ = "permission.role.read";

export type RoleListItem = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  type: RoleType;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  memberCount: number;
};

export async function listRoles(
  actorEmployeeId: string,
): Promise<Result<RoleListItem[]>> {
  try {
    await assertPermission(actorEmployeeId, ROLE_READ);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const roles = await prisma.role.findMany({
    where: { companyId: actor.companyId },
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      type: true,
      isSystem: true,
      isActive: true,
      createdAt: true,
      _count: { select: { userRoles: { where: { isActive: true } } } },
    },
    orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
  });

  return ok(
    roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      icon: r.icon,
      type: r.type,
      isSystem: r.isSystem,
      isActive: r.isActive,
      createdAt: r.createdAt,
      memberCount: r._count.userRoles,
    })),
  );
}

export async function createRole(
  actorEmployeeId: string,
  raw: RoleCreateInput,
): Promise<Result<{ roleId: string }>> {
  const parsed = roleCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return err(
      errors.validation(parsed.error.issues[0]?.message ?? "입력 오류"),
    );
  }

  try {
    await assertPermission(actorEmployeeId, ROLE_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const dup = await prisma.role.findFirst({
    where: { companyId: actor.companyId, name: parsed.data.name },
    select: { id: true },
  });
  if (dup) return err(errors.conflict("이미 같은 이름의 역할이 있어요"));

  const role = await prisma.role.create({
    data: {
      companyId: actor.companyId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      icon: parsed.data.icon ?? null,
      type: "CUSTOM",
      isSystem: false,
    },
  });

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "permission",
    eventType: "CREATE",
    targetType: "Role",
    targetId: role.id,
    targetLabel: role.name,
    description: `역할 생성: ${role.name}`,
    afterSnapshot: {
      name: role.name,
      description: role.description,
      icon: role.icon,
    },
  });

  return ok({ roleId: role.id });
}

export async function updateRole(
  actorEmployeeId: string,
  roleId: string,
  raw: RoleUpdateInput,
): Promise<Result<{ roleId: string }>> {
  const parsed = roleUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return err(
      errors.validation(parsed.error.issues[0]?.message ?? "입력 오류"),
    );
  }

  try {
    await assertPermission(actorEmployeeId, ROLE_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      companyId: true,
      type: true,
      isSystem: true,
      isActive: true,
    },
  });
  // cross-tenant: 다른 회사 역할은 존재 여부 자체를 은닉
  if (!role || role.companyId !== actor.companyId) {
    return err(errors.notFound("역할을 찾을 수 없어요"));
  }
  if (
    role.isSystem ||
    role.type === "SYSTEM_SUPER_ADMIN" ||
    role.type === "DYNAMIC_ORG_HEAD"
  ) {
    return err(errors.forbidden("시스템 역할은 수정할 수 없어요"));
  }

  if (parsed.data.name && parsed.data.name !== role.name) {
    const dup = await prisma.role.findFirst({
      where: {
        companyId: actor.companyId,
        name: parsed.data.name,
        NOT: { id: roleId },
      },
      select: { id: true },
    });
    if (dup) return err(errors.conflict("이미 같은 이름의 역할이 있어요"));
  }

  const before = {
    name: role.name,
    description: role.description,
    icon: role.icon,
    isActive: role.isActive,
  };

  const updated = await prisma.role.update({
    where: { id: roleId },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.description !== undefined
        ? { description: parsed.data.description }
        : {}),
      ...(parsed.data.icon !== undefined ? { icon: parsed.data.icon } : {}),
      ...(parsed.data.isActive !== undefined
        ? { isActive: parsed.data.isActive }
        : {}),
    },
  });

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "permission",
    eventType: "UPDATE",
    targetType: "Role",
    targetId: updated.id,
    targetLabel: updated.name,
    description: `역할 수정: ${updated.name}`,
    beforeSnapshot: before,
    afterSnapshot: {
      name: updated.name,
      description: updated.description,
      icon: updated.icon,
      isActive: updated.isActive,
    },
  });

  return ok({ roleId: updated.id });
}

export async function deleteRole(
  actorEmployeeId: string,
  roleId: string,
): Promise<Result<{ roleId: string }>> {
  try {
    await assertPermission(actorEmployeeId, ROLE_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: {
      id: true,
      name: true,
      companyId: true,
      type: true,
      isSystem: true,
      _count: { select: { userRoles: { where: { isActive: true } } } },
    },
  });
  if (!role || role.companyId !== actor.companyId) {
    return err(errors.notFound("역할을 찾을 수 없어요"));
  }
  if (
    role.isSystem ||
    role.type === "SYSTEM_SUPER_ADMIN" ||
    role.type === "DYNAMIC_ORG_HEAD"
  ) {
    return err(errors.forbidden("시스템 역할은 삭제할 수 없어요"));
  }
  if (role._count.userRoles > 0) {
    return err(
      errors.conflict(
        "이 역할이 배정된 구성원이 있어요. 먼저 배정을 해제해 주세요.",
      ),
    );
  }

  await prisma.role.delete({ where: { id: roleId } });

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "permission",
    eventType: "DELETE",
    targetType: "Role",
    targetId: roleId,
    targetLabel: role.name,
    description: `역할 삭제: ${role.name}`,
  });

  return ok({ roleId });
}
