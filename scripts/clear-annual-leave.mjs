import { PrismaClient } from "../packages/db/generated/client/index.js";

const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://teamlet:teamlet@localhost:5432/teamlet?schema=public" } },
});

const annualTypes = await prisma.leaveType.findMany({
  where: { key: "annual" },
  select: { id: true, name: true },
});
console.log(`annual 타입 ${annualTypes.length}개 발견`);

const annualIds = annualTypes.map((t) => t.id);

const txDel = await prisma.leaveTransaction.deleteMany({
  where: { leaveTypeId: { in: annualIds } },
});
console.log(`LeaveTransaction 삭제: ${txDel.count}건`);

const balDel = await prisma.leaveBalance.deleteMany({
  where: { leaveTypeId: { in: annualIds } },
});
console.log(`LeaveBalance 삭제: ${balDel.count}건`);

console.log("완료!");
await prisma.$disconnect();
