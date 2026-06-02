import { PrismaClient } from "../packages/db/generated/client/index.js";

const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://teamlet:teamlet@localhost:5432/teamlet?schema=public" } },
});

const companies = await prisma.company.findMany({ select: { id: true, name: true } });

for (const company of companies) {
  console.log(`\n=== ${company.name} ===`);

  const policies = await prisma.leavePolicy.findMany({
    where: { companyId: company.id },
    select: { id: true, name: true, isDefault: true, isActive: true, approverEmployeeId: true, leaveTypeId: true },
  });
  console.log("LeavePolicy:", policies.length, "개");
  policies.forEach(p => console.log(`  ${p.name} | default=${p.isDefault} | active=${p.isActive} | approver=${p.approverEmployeeId ?? "없음"}`));

  const assignments = await prisma.leavePolicyAssignment.findMany({
    where: { policy: { companyId: company.id } },
    select: { employeeId: true, policyId: true, employee: { select: { name: true } } },
  });
  console.log("LeavePolicyAssignment:", assignments.length, "개");
  assignments.forEach(a => console.log(`  ${a.employee.name}`));

  const activeEmps = await prisma.employee.count({ where: { companyId: company.id, isActive: true } });
  console.log(`활성 구성원: ${activeEmps}명`);

  const balances = await prisma.leaveBalance.count({ where: { employee: { companyId: company.id } } });
  const transactions = await prisma.leaveTransaction.count({ where: { employee: { companyId: company.id } } });
  console.log(`LeaveBalance: ${balances}건 | LeaveTransaction: ${transactions}건`);
}

await prisma.$disconnect();
