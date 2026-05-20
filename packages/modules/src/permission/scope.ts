/**
 * Scope 평가 (docs/01 §5, docs/03 §7).
 * P1 범위: ALL / SELF 실구현. DEPARTMENT / DIRECT_REPORTS 는 P2 (Employee 부서/manager 관계 도입 후).
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
    case "DIRECT_REPORTS":
      return false;
  }
}
