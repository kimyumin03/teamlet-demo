/**
 * 역할-권한 매핑 + Scope 편집 (docs/02 §11-1 우측 편집 영역, docs/03 §7).
 *
 * P1: "전체 교체" 패턴 — 저장 시 기존 RolePermission 을 모두 지우고 입력으로 재생성.
 * 단순하고 atomic. diff 기반 upsert 는 매핑 수가 커지면 도입 (P2+).
 *
 * 가드: `permission.role.manage` + cross-tenant + 시스템 역할 보호.
 * (loadActor / catchDomainErr 는 role.ts 와 중복 — 추후 _actor.ts 로 추출 예정.)
 */

import { prisma } from "@teamlet/db";
import {
  err,
  errors,
  ok,
  setRolePermissionsSchema,
  type Result,
  type SetRolePermissionsInput,
} from "@teamlet/shared";
import { recordAudit } from "../audit/index";
import { catchDomainErr, loadActor } from "./_actor";
import { assertPermission } from "./assert";

const ROLE_MANAGE = "permission.role.manage";

export async function setRolePermissions(
  actorEmployeeId: string,
  roleId: string,
  raw: SetRolePermissionsInput,
): Promise<Result<{ roleId: string; count: number }>> {
  const parsed = setRolePermissionsSchema.safeParse(raw);
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
      companyId: true,
      type: true,
      isSystem: true,
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
    return err(errors.forbidden("시스템 역할의 권한은 수정할 수 없어요"));
  }

  // 권한 카탈로그 검증 (전사 단일 카탈로그)
  const items = parsed.data.items;
  const uniqueKeys = Array.from(new Set(items.map((i) => i.permissionKey)));
  if (uniqueKeys.length !== items.length) {
    return err(errors.validation("같은 권한이 중복되었어요"));
  }
  const permissions = await prisma.permission.findMany({
    where: { key: { in: uniqueKeys } },
    select: { id: true, key: true, hasScope: true },
  });
  const byKey = new Map(permissions.map((p) => [p.key, p]));

  for (const item of items) {
    const p = byKey.get(item.permissionKey);
    if (!p) {
      return err(
        errors.validation(`알 수 없는 권한 키: ${item.permissionKey}`),
      );
    }
    if (item.scopeType && !p.hasScope) {
      return err(
        errors.validation(`${item.permissionKey} 는 범위 옵션이 없어요`),
      );
    }
    if (
      item.scopeType === "DEPARTMENT" &&
      (item.departmentIds ?? []).length === 0
    ) {
      return err(
        errors.validation(
          `${item.permissionKey} 의 대상 부서를 선택해 주세요`,
        ),
      );
    }
  }

  const existing = await prisma.rolePermission.findMany({
    where: { roleId },
    select: {
      scopeType: true,
      departmentIds: true,
      includeSubDepartments: true,
      permission: { select: { key: true } },
    },
  });
  const before = existing.map((rp) => ({
    key: rp.permission.key,
    scopeType: rp.scopeType,
    departmentIds: rp.departmentIds,
    includeSubDepartments: rp.includeSubDepartments,
  }));

  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId } });
    if (items.length > 0) {
      await tx.rolePermission.createMany({
        data: items.map((item) => {
          const p = byKey.get(item.permissionKey)!;
          const isDept = item.scopeType === "DEPARTMENT";
          return {
            roleId,
            permissionId: p.id,
            enabled: true,
            scopeType: p.hasScope ? (item.scopeType ?? null) : null,
            departmentIds: isDept ? (item.departmentIds ?? []) : [],
            includeSubDepartments: isDept
              ? (item.includeSubDepartments ?? false)
              : false,
          };
        }),
      });
    }
  });

  const after = items.map((item) => ({
    key: item.permissionKey,
    scopeType: item.scopeType ?? null,
    departmentIds:
      item.scopeType === "DEPARTMENT" ? (item.departmentIds ?? []) : [],
    includeSubDepartments:
      item.scopeType === "DEPARTMENT"
        ? (item.includeSubDepartments ?? false)
        : false,
  }));

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "permission",
    eventType: "UPDATE",
    targetType: "Role",
    targetId: role.id,
    targetLabel: role.name,
    description: `역할 권한 매핑 변경: ${role.name} (${items.length}개)`,
    beforeSnapshot: { permissions: before },
    afterSnapshot: { permissions: after },
  });

  return ok({ roleId: role.id, count: items.length });
}
