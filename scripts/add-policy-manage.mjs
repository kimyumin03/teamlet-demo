import { PrismaClient } from "../packages/db/generated/client/index.js";
const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://teamlet:teamlet@localhost:5432/teamlet?schema=public" } },
});

// hr@teamlet.test에 leave.policy.manage 권한 추가
const user = await prisma.user.findUnique({
  where: { email: "hr@teamlet.test" },
  select: { memberships: { select: { employeeId: true, employee: { select: { companyId: true } } } } },
});

const membership = user?.memberships?.[0];
if (!membership) { console.log("Employee 없음"); process.exit(1); }

const empId = membership.employeeId;
const companyId = membership.employee.companyId;

// leave.policy.manage 권한 키 조회
const perm = await prisma.permission.findFirst({ where: { key: "leave.policy.manage" }, select: { id: true } });
if (!perm) { console.log("leave.policy.manage 권한 카탈로그에 없음"); process.exit(1); }

// hr 계정의 역할 조회
const userRoles = await prisma.userRole.findMany({
  where: { employeeId: empId },
  select: { roleId: true, role: { select: { name: true } } },
});

if (userRoles.length === 0) { console.log("UserRole 없음"); process.exit(1); }

// 첫 번째 역할에 권한 추가 (이미 있으면 건너뜀)
const roleId = userRoles[0].roleId;
const existing = await prisma.rolePermission.findFirst({ where: { roleId, permissionId: perm.id } });

if (existing) {
  console.log(`leave.policy.manage 이미 있음 (role: ${userRoles[0].role.name})`);
} else {
  await prisma.rolePermission.create({ data: { roleId, permissionId: perm.id } });
  console.log(`✅ leave.policy.manage 추가 완료 (role: ${userRoles[0].role.name})`);
}

await prisma.$disconnect();
