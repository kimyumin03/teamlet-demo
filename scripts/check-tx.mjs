import { PrismaClient } from "../packages/db/generated/client/index.js";
const p = new PrismaClient({ datasources: { db: { url: "postgresql://teamlet:teamlet@localhost:5432/teamlet?schema=public" } } });

const txs = await p.leaveTransaction.findMany({
  include: { employee: { select: { name: true } }, leaveType: { select: { key: true, name: true } } },
  orderBy: { occurredAt: "desc" },
});

console.log(`LeaveTransaction ${txs.length}건:`);
txs.forEach(t => {
  console.log(`  ${t.employee.name} | ${t.leaveType.name} | ${t.txType} | ${t.days}일 | note: ${t.note ?? "-"}`);
});

await p.$disconnect();
