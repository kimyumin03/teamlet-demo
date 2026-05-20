/**
 * 권한 단언 (docs/04 §3-6).
 * 모든 mutation 진입점에서 호출. 미보유 시 FORBIDDEN throw.
 *
 *   await assertPermission(employeeId, "employee.profile.read", { targetEmployeeId });
 *
 * 회사 컨텍스트는 employeeId 에서 결정됨 (Employee.companyId).
 */

import { errors } from "@teamlet/shared";
import { getEffectivePermissions } from "./effective";
import { matchesScope } from "./scope";
import type { EffectivePermission, PermissionKey, ScopeContext } from "./types";

export async function assertPermission(
  employeeId: string,
  key: PermissionKey,
  ctx: ScopeContext = {},
): Promise<EffectivePermission> {
  const perms = await getEffectivePermissions(employeeId);
  const perm = perms.get(key);

  if (!perm) {
    throw errors.forbidden(`권한이 없어요 (${key})`);
  }

  if (!matchesScope(perm, employeeId, ctx)) {
    throw errors.forbidden(`범위 밖이에요 (${key})`);
  }

  return perm;
}

export async function hasPermission(
  employeeId: string,
  key: PermissionKey,
  ctx: ScopeContext = {},
): Promise<boolean> {
  const perms = await getEffectivePermissions(employeeId);
  const perm = perms.get(key);
  if (!perm) return false;
  return matchesScope(perm, employeeId, ctx);
}
