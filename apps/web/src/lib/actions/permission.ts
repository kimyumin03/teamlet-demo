"use server";

import { redirect } from "next/navigation";
import {
  assignRole,
  createRole,
  deleteRole,
  getPermissionCatalog,
  revokeRole,
  setRolePermissions,
  updateRole,
  type CatalogCategory,
} from "@teamlet/modules/permission";
import {
  toApiResponse,
  type ApiResponse,
  type RoleCreateInput,
  type RoleUpdateInput,
  type SetRolePermissionsInput,
} from "@teamlet/shared";
import { auth } from "@/auth";

async function requireEmployeeId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");
  return session.user.employeeId;
}

/**
 * 권한 카탈로그 조회 (docs/02 §11-1 좌측 카테고리 탭).
 * 회사 소속 직원만 호출 가능. 권한 가드는 호출 페이지에서 별도 적용.
 */
export async function getPermissionCatalogAction(): Promise<CatalogCategory[]> {
  await requireEmployeeId();
  return getPermissionCatalog();
}

/** 역할 생성 — `permission.role.manage` 가드 (모듈 내부) */
export async function createRoleAction(
  input: RoleCreateInput,
): Promise<ApiResponse<{ roleId: string }>> {
  const employeeId = await requireEmployeeId();
  return toApiResponse(await createRole(employeeId, input));
}

/** 역할 수정 */
export async function updateRoleAction(
  roleId: string,
  patch: RoleUpdateInput,
): Promise<ApiResponse<{ roleId: string }>> {
  const employeeId = await requireEmployeeId();
  return toApiResponse(await updateRole(employeeId, roleId, patch));
}

/** 역할 삭제 — 시스템 역할 / 배정자 있는 역할은 거절 */
export async function deleteRoleAction(
  roleId: string,
): Promise<ApiResponse<{ roleId: string }>> {
  const employeeId = await requireEmployeeId();
  return toApiResponse(await deleteRole(employeeId, roleId));
}

/** 역할-권한 매핑 일괄 설정 (전체 교체) */
export async function setRolePermissionsAction(
  roleId: string,
  input: SetRolePermissionsInput,
): Promise<ApiResponse<{ roleId: string; count: number }>> {
  const employeeId = await requireEmployeeId();
  return toApiResponse(await setRolePermissions(employeeId, roleId, input));
}

/** 직원에게 역할 부여 */
export async function assignRoleAction(
  targetEmployeeId: string,
  roleId: string,
): Promise<ApiResponse<{ userRoleId: string }>> {
  const employeeId = await requireEmployeeId();
  return toApiResponse(await assignRole(employeeId, targetEmployeeId, roleId));
}

/** 직원의 역할 매핑 해제 — SYSTEM_SUPER_ADMIN 은 락아웃 가드 적용 */
export async function revokeRoleAction(
  userRoleId: string,
): Promise<ApiResponse<{ userRoleId: string }>> {
  const employeeId = await requireEmployeeId();
  return toApiResponse(await revokeRole(employeeId, userRoleId));
}
