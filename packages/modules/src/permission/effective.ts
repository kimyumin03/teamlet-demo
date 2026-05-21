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
  // 직원 기본 정보 + 조직장 여부 함께 조회
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      companyId: true,
      departmentId: true,
      position: { select: { isOrgHead: true } },
    },
  });

  const [userRoles, orgHeadRole] = await Promise.all([
    prisma.userRole.findMany({
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
    }),
    // 조직장이고 부서가 있을 때만 DYNAMIC_ORG_HEAD 역할 조회
    employee?.position?.isOrgHead && employee.departmentId && employee.companyId
      ? prisma.role.findFirst({
          where: { companyId: employee.companyId, type: "DYNAMIC_ORG_HEAD", isActive: true },
          include: {
            rolePermissions: {
              where: { enabled: true },
              include: { permission: true },
            },
          },
        })
      : Promise.resolve(null),
  ]);

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

  // DYNAMIC_ORG_HEAD 권한 자동 주입
  if (orgHeadRole && employee?.departmentId) {
    for (const rp of orgHeadRole.rolePermissions) {
      const key = rp.permission.key;
      const incoming: EffectivePermission = {
        key,
        action: rp.permission.action,
        scopeType: "DEPARTMENT",
        departmentIds: [employee.departmentId],
        includeSubDepartments: rp.includeSubDepartments,
        sourceRoleIds: [orgHeadRole.id],
        sourceRoleTypes: ["DYNAMIC_ORG_HEAD"],
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
