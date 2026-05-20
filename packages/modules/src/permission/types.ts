/**
 * 권한 평가 타입 (docs/01 §5, docs/03 §7).
 * RBAC + Scope(전체/부서/직속/본인) + 동적 역할.
 */

import type { PermissionAction, RoleType, ScopeType } from "@teamlet/db";

export type PermissionKey = string;

export type EffectivePermission = {
  key: PermissionKey;
  action: PermissionAction;
  scopeType: ScopeType | null;
  departmentIds: string[];
  includeSubDepartments: boolean;
  sourceRoleIds: string[];
  sourceRoleTypes: RoleType[];
};

/** 호출자가 평가하려는 자원의 컨텍스트. Scope 좁히기에 사용 */
export type ScopeContext = {
  targetEmployeeId?: string;
  targetDepartmentId?: string;
};
