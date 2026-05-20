/**
 * 락아웃 방지 (PROGRESS 체크리스트 6번, docs/02 §16 의 권한 도메인 적용).
 *
 * 시나리오: 회사에서 활성 `SYSTEM_SUPER_ADMIN` UserRole 이 0이 되면 권한 관리 인터페이스
 * 자체에 누구도 진입할 수 없어 회사가 사실상 "잠긴" 상태가 됨.
 *
 * 진입점 (현재 호출처 없음 — 추후 UserRole CRUD / Employee 비활성화 PR 에서):
 *   1) UserRole 박탈/비활성화
 *   2) Employee 비활성화 (membership LEFT/SUSPENDED)
 *   3) SUPER_ADMIN Role 비활성화 (Role.update isActive=false)
 *
 * Role / RolePermission 변경 진입점 (createRole/updateRole/setRolePermissions/deleteRole) 은
 * 이미 `isSystem` 가드로 시스템 역할 자체 변경을 막고 있어 별도 호출 불필요.
 */

import { prisma } from "@teamlet/db";
import { err, errors, ok, type Result } from "@teamlet/shared";

/**
 * 회사의 활성 SYSTEM_SUPER_ADMIN UserRole 수.
 * - UserRole.isActive = true
 * - Role.type = SYSTEM_SUPER_ADMIN
 * - Role.isActive = true
 */
export async function countActiveSuperAdmins(
  companyId: string,
): Promise<number> {
  return prisma.userRole.count({
    where: {
      isActive: true,
      role: {
        companyId,
        type: "SYSTEM_SUPER_ADMIN",
        isActive: true,
      },
    },
  });
}

/**
 * `removingUserRoleIds` 가 박탈된다고 가정했을 때 회사에 SUPER_ADMIN UserRole 이
 * 1개 이상 남는지 확인. 0 이면 CONFLICT.
 *
 * @param removingUserRoleIds 박탈/비활성화 예정인 UserRole id (빈 배열도 허용)
 */
export async function assertNotLastSuperAdmin(
  companyId: string,
  removingUserRoleIds: string[],
): Promise<Result<void>> {
  const remaining = await prisma.userRole.count({
    where: {
      isActive: true,
      role: {
        companyId,
        type: "SYSTEM_SUPER_ADMIN",
        isActive: true,
      },
      ...(removingUserRoleIds.length > 0
        ? { NOT: { id: { in: removingUserRoleIds } } }
        : {}),
    },
  });

  if (remaining < 1) {
    return err(
      errors.conflict(
        "회사에 최고 관리자가 최소 1명 이상 남아 있어야 해요",
      ),
    );
  }
  return ok(undefined);
}
