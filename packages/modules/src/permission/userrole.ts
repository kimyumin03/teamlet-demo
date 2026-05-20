/**
 * UserRole 배정/해제 (docs/03 §7 UserRole).
 *
 * 가드: `permission.role.manage` + cross-tenant + 락아웃 (마지막 SUPER_ADMIN 박탈 차단).
 *
 * (loadActor / catchDomainErr 는 role.ts / mapping.ts 와 중복 — 추후 _actor.ts 추출 예정.)
 */

import { prisma } from "@teamlet/db";
import { err, errors, ok, type Result } from "@teamlet/shared";
import { recordAudit } from "../audit/index";
import { catchDomainErr, loadActor } from "./_actor";
import { assertPermission } from "./assert";
import { assertNotLastSuperAdmin } from "./lockout";

const ROLE_MANAGE = "permission.role.manage";

/**
 * 직원에게 역할 부여. 이미 비활성 매핑이 있으면 재활성화(rebind),
 * 활성 매핑이면 CONFLICT.
 */
export async function assignRole(
  actorEmployeeId: string,
  targetEmployeeId: string,
  roleId: string,
): Promise<Result<{ userRoleId: string }>> {
  try {
    await assertPermission(actorEmployeeId, ROLE_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const [target, role] = await Promise.all([
    prisma.employee.findUnique({
      where: { id: targetEmployeeId },
      select: {
        id: true,
        name: true,
        companyId: true,
        employmentStatus: true,
      },
    }),
    prisma.role.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        name: true,
        companyId: true,
        isActive: true,
      },
    }),
  ]);
  if (!target || target.companyId !== actor.companyId) {
    return err(errors.notFound("대상 직원을 찾을 수 없어요"));
  }
  if (!role || role.companyId !== actor.companyId) {
    return err(errors.notFound("역할을 찾을 수 없어요"));
  }
  if (!role.isActive) {
    return err(errors.conflict("비활성 역할은 부여할 수 없어요"));
  }

  const existing = await prisma.userRole.findUnique({
    where: {
      employeeId_roleId: { employeeId: targetEmployeeId, roleId },
    },
    select: { id: true, isActive: true },
  });

  if (existing?.isActive) {
    return err(errors.conflict("이미 부여된 역할이에요"));
  }

  const userRole = existing
    ? await prisma.userRole.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          assignedByUserId: actor.userId,
          assignedAt: new Date(),
        },
        select: { id: true },
      })
    : await prisma.userRole.create({
        data: {
          employeeId: targetEmployeeId,
          roleId,
          assignedByUserId: actor.userId,
          isActive: true,
        },
        select: { id: true },
      });

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "permission",
    eventType: "CREATE",
    targetType: "UserRole",
    targetId: userRole.id,
    targetLabel: `${target.name} ← ${role.name}`,
    description: `역할 부여: ${role.name} → ${target.name}${existing ? " (재활성화)" : ""}`,
  });

  return ok({ userRoleId: userRole.id });
}

/**
 * 직원의 역할 매핑 해제 (UserRole.isActive = false).
 * SYSTEM_SUPER_ADMIN 해제 시 락아웃 가드 호출.
 */
export async function revokeRole(
  actorEmployeeId: string,
  userRoleId: string,
): Promise<Result<{ userRoleId: string }>> {
  try {
    await assertPermission(actorEmployeeId, ROLE_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const userRole = await prisma.userRole.findUnique({
    where: { id: userRoleId },
    select: {
      id: true,
      isActive: true,
      employee: { select: { name: true, companyId: true } },
      role: { select: { name: true, type: true } },
    },
  });
  if (!userRole || userRole.employee.companyId !== actor.companyId) {
    return err(errors.notFound("부여 정보를 찾을 수 없어요"));
  }
  if (!userRole.isActive) {
    return err(errors.conflict("이미 해제된 역할이에요"));
  }

  if (userRole.role.type === "SYSTEM_SUPER_ADMIN") {
    const guard = await assertNotLastSuperAdmin(actor.companyId, [userRole.id]);
    if (!guard.ok) return guard;
  }

  await prisma.userRole.update({
    where: { id: userRoleId },
    data: { isActive: false },
  });

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "permission",
    eventType: "DELETE",
    targetType: "UserRole",
    targetId: userRoleId,
    targetLabel: `${userRole.employee.name} ← ${userRole.role.name}`,
    description: `역할 해제: ${userRole.role.name} ← ${userRole.employee.name}`,
  });

  return ok({ userRoleId });
}
