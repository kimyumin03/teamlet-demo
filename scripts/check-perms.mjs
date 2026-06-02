import { PrismaClient } from "../packages/db/generated/client/index.js";
const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://teamlet:teamlet@localhost:5432/teamlet?schema=public" } },
});

// hr@teamlet.test의 Employee 권한 확인 (RolePermission → Permission.key)
const user = await prisma.user.findUnique({
  where: { email: "hr@teamlet.test" },
  select: { memberships: { select: { employeeId: true } } },
});

const empId = user?.memberships?.[0]?.employeeId;
if (!empId) { console.log("Employee 없음"); process.exit(0); }

const userRoles = await prisma.userRole.findMany({
  where: { employeeId: empId },
  select: { role: { select: { name: true, rolePermissions: { select: { permission: { select: { key: true } } } } } } },
});

const allPerms = userRoles.flatMap(ur => ur.role.rolePermissions.map(rp => rp.permission.key));
console.log("hr 계정 leave 관련 권한:", allPerms.filter(p => p.includes("leave")));
console.log("leave.policy.manage:", allPerms.includes("leave.policy.manage") ? "✅" : "❌ 없음 → 자동부여 실패 원인");

await prisma.$disconnect();
