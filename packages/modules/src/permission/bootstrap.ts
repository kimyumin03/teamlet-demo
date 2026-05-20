/**
 * 회사 부트스트랩 — 신규 Company 생성 직후 호출하는 헬퍼.
 *
 * 시스템 역할 3종(SYSTEM_SUPER_ADMIN / DYNAMIC_ORG_HEAD / DEFAULT)을 idempotent 하게 보장하고,
 * SUPER_ADMIN 에 카탈로그 전권한을 `scopeType: ALL`(hasScope=true 권한 한정) 로 매핑한다.
 *
 * 호출처: 추후 Sales-led 회사 승인 흐름(별도 PR). 현재는 미호출 — dead code 임을 인지하고
 * 추가. 권한 카탈로그가 변경되면 회사별로 재호출하여 SUPER_ADMIN 권한을 동기화할 수도 있음.
 *
 * audit 은 호출처에서 actor 정보와 함께 기록하는 것을 가정 — 여기선 기록하지 않음.
 */

import { prisma } from "@teamlet/db";
import type { RoleType } from "@teamlet/db";
import { errors } from "@teamlet/shared";

export type BootstrapResult = {
  superAdminRoleId: string;
  orgHeadRoleId: string;
  defaultRoleId: string;
};

async function ensureSystemRole(
  companyId: string,
  spec: { name: string; type: RoleType; description: string },
): Promise<{ id: string }> {
  return prisma.role.upsert({
    where: { companyId_name: { companyId, name: spec.name } },
    create: {
      companyId,
      name: spec.name,
      description: spec.description,
      type: spec.type,
      isSystem: true,
    },
    update: {},
    select: { id: true },
  });
}

export async function bootstrapCompanyRoles(
  companyId: string,
): Promise<BootstrapResult> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true },
  });
  if (!company) throw errors.notFound("회사를 찾을 수 없어요");

  const [superAdmin, orgHead, defaultRole] = await Promise.all([
    ensureSystemRole(companyId, {
      name: "최고 관리자",
      type: "SYSTEM_SUPER_ADMIN",
      description: "전사 권한 보유. 회사에 반드시 1명 이상 유지되어야 해요.",
    }),
    ensureSystemRole(companyId, {
      name: "조직장",
      type: "DYNAMIC_ORG_HEAD",
      description:
        "조직장 직책에 자동 매핑 (PositionHistory.is_organization_head).",
    }),
    ensureSystemRole(companyId, {
      name: "기본",
      type: "DEFAULT",
      description: "구성원 기본 역할.",
    }),
  ]);

  const permissions = await prisma.permission.findMany({
    select: { id: true, hasScope: true },
  });

  await prisma.$transaction(
    permissions.map((p) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdmin.id,
            permissionId: p.id,
          },
        },
        create: {
          roleId: superAdmin.id,
          permissionId: p.id,
          enabled: true,
          scopeType: p.hasScope ? "ALL" : null,
        },
        update: {
          enabled: true,
          scopeType: p.hasScope ? "ALL" : null,
        },
      }),
    ),
  );

  return {
    superAdminRoleId: superAdmin.id,
    orgHeadRoleId: orgHead.id,
    defaultRoleId: defaultRole.id,
  };
}
