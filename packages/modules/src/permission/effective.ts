/**
 * Effective Permissions 계산 (docs/03 §7).
 * UserRole → Role → RolePermission → Permission 조인으로 한 직원의 권한을 집계.
 * 같은 권한 key가 여러 역할에서 나오면 가장 넓은 scope (ALL > DEPARTMENT > DIRECT > SELF) 채택.
 *
 * P1: read-through (캐시 없음). EffectivePermission 캐시 테이블은 향후 도입.
 */

import { prisma } from "@teamlet/db";
import type { ScopeType } from "@teamlet/db";
import type { EffectivePermission, PermissionKey } from "./types";

const SCOPE_RANK: Record<ScopeType, number> = {
  ALL: 4,
  DEPARTMENT: 3,
  DIRECT_REPORTS: 2,
  SELF: 1,
};

export async function getEffectivePermissions(
  employeeId: string,
): Promise<Map<PermissionKey, EffectivePermission>> {
  const userRoles = await prisma.userRole.findMany({
    where: { employeeId, isActive: true },
    include: {
      role: {
        include: {
          rolePermissions: {
            where: { enabled: true },
            include: { permission: true },
          },
        },
      },
    },
  });

  const merged = new Map<PermissionKey, EffectivePermission>();

  for (const ur of userRoles) {
    if (!ur.role.isActive) continue;
    for (const rp of ur.role.rolePermissions) {
      const key = rp.permission.key;
      const incoming: EffectivePermission = {
        key,
        action: rp.permission.action,
        scopeType: rp.scopeType,
        departmentIds: rp.departmentIds,
        includeSubDepartments: rp.includeSubDepartments,
        sourceRoleIds: [ur.role.id],
        sourceRoleTypes: [ur.role.type],
      };

      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, incoming);
        continue;
      }

      const rankExisting = existing.scopeType
        ? SCOPE_RANK[existing.scopeType]
        : Number.POSITIVE_INFINITY;
      const rankIncoming = incoming.scopeType
        ? SCOPE_RANK[incoming.scopeType]
        : Number.POSITIVE_INFINITY;

      const winner = rankIncoming > rankExisting ? incoming : existing;

      merged.set(key, {
        ...winner,
        departmentIds: dedupe([
          ...existing.departmentIds,
          ...incoming.departmentIds,
        ]),
        includeSubDepartments:
          existing.includeSubDepartments || incoming.includeSubDepartments,
        sourceRoleIds: dedupe([
          ...existing.sourceRoleIds,
          ...incoming.sourceRoleIds,
        ]),
        sourceRoleTypes: dedupe([
          ...existing.sourceRoleTypes,
          ...incoming.sourceRoleTypes,
        ]),
      });
    }
  }

  return merged;
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
