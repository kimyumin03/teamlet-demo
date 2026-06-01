import { PrismaClient } from "../packages/db/generated/client/index.js";

const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://teamlet:teamlet@localhost:5432/teamlet?schema=public" } },
});

const companies = await prisma.company.findMany({ select: { id: true, name: true } });
console.log(`회사 ${companies.length}개에 연차 유형 생성 중...`);
for (const company of companies) {
  await prisma.leaveType.upsert({
    where: { companyId_key: { companyId: company.id, key: "annual" } },
    create: {
      companyId: company.id, key: "annual", name: "연차",
      description: "연차유급휴가 (정책 기반 자동 부여)",
      isSystem: true, isRequired: true,
      grantMethod: "PERIODIC", grantUnit: "DAY",
      paymentType: "PAID", genderRestriction: "ALL", evidenceRequirement: "NONE",
    },
    update: { isActive: true },
  });
  console.log(`  ✓ ${company.name}`);
}
console.log("완료!");
await prisma.$disconnect();
