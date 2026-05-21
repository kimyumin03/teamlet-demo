/**
 * Scope 평가 (docs/01 §5, docs/03 §7).
 * ALL / SELF / DEPARTMENT 실구현. DIRECT_REPORTS 는 향후 manager 관계 도입 후.
 */

import type { EffectivePermission, ScopeContext } from "./types";

export function matchesScope(
  perm: EffectivePermission,
  actorEmployeeId: string,
  ctx: ScopeContext,
): boolean {
  if (perm.scopeType === null) return true;

  switch (perm.scopeType) {
    case "ALL":
      return true;

    case "SELF":
      return Boolean(
        ctx.targetEmployeeId && ctx.targetEmployeeId === actorEmployeeId,
      );

    case "DEPARTMENT":
      return Boolean(
        perm.departmentIds.length > 0 &&
          ctx.targetDepartmentId != null &&
          perm.departmentIds.includes(ctx.targetDepartmentId),
      );

    case "DIRECT_REPORTS":
      return false;
  }
}
