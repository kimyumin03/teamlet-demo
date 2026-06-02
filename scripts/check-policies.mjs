import { PrismaClient } from "../packages/db/generated/client/index.js";

const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://teamlet:teamlet@localhost:5432/teamlet?schema=public" } },
});

const annualTypes = await prisma.leaveType.findMany({
  where: { key: "annual" },
  select: { id: true, name: true, grantMethod: true, grantAmount: true, companyId: true },
});
console.log("=== annual LeaveType ===");
console.log(JSON.stringify(annualTypes, null, 2));

const allTypes = await prisma.leaveType.findMany({
  where: { companyId: annualTypes[0]?.companyId },
  select: { key: true, name: true, grantMethod: true, grantAmount: true, isActive: true },
  orderBy: { sortOrder: "asc" },
});
console.log("\n=== 전체 LeaveType (첫번째 회사) ===");
allTypes.forEach(t => console.log(`  ${t.key}: ${t.name} (${t.grantMethod}, ${t.grantAmount ?? "null"}일)`));

await prisma.$disconnect();
