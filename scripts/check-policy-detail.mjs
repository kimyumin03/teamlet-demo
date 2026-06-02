import { PrismaClient } from "../packages/db/generated/client/index.js";
const p = new PrismaClient({ datasources: { db: { url: "postgresql://teamlet:teamlet@localhost:5432/teamlet?schema=public" } } });

const policies = await p.leavePolicy.findMany({
  include: { leaveType: { select: { id: true, key: true, name: true, grantAmount: true, isActive: true } } },
  orderBy: { createdAt: "asc" },
});

console.log(`LeavePolicy ${policies.length}개:`);
for (const pol of policies) {
  console.log(`\n[${pol.name}]`);
  console.log("  isDefault:", pol.isDefault, "| isActive:", pol.isActive);
  console.log("  leaveType:", pol.leaveType.name, `(key: ${pol.leaveType.key}, isActive: ${pol.leaveType.isActive})`);
  console.log("  leaveType.grantAmount:", pol.leaveType.grantAmount ?? "null (법정 계산 사용)");
}

// 기존 LeaveTransaction 확인
const txCount = await p.leaveTransaction.count();
console.log("\n현재 LeaveTransaction:", txCount, "건");

await p.$disconnect();
