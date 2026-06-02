import { PrismaClient } from "../packages/db/generated/client/index.js";

const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://teamlet:teamlet@localhost:5432/teamlet?schema=public" } },
});

const EXTRA = [
  {
    key: "maternity_multiple",
    name: "산전후휴가(다태아)",
    description: "다태아 출산 전후 휴가 (120일)",
    grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: 120,
    paymentType: "PAID", genderRestriction: "FEMALE", evidenceRequirement: "BEFORE",
  },
  {
    key: "miscarriage",
    name: "유산·사산휴가",
    description: "유산 또는 사산 시 (임신 주수에 따라 5~90일, 유급)",
    grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: null,
    paymentType: "PAID", genderRestriction: "FEMALE", evidenceRequirement: "BEFORE",
  },
  {
    key: "miscarriage_multiple",
    name: "유산·사산휴가(다태아)",
    description: "다태아 임신 중 유산 또는 사산 시 (임신 주수+15일, 유급)",
    grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: null,
    paymentType: "PAID", genderRestriction: "FEMALE", evidenceRequirement: "BEFORE",
  },
];

const companies = await prisma.company.findMany({ select: { id: true, name: true } });
console.log(`${companies.length}개 회사에 누락 법정 휴가 3종 추가 중...`);

for (const company of companies) {
  for (const lt of EXTRA) {
    await prisma.leaveType.upsert({
      where: { companyId_key: { companyId: company.id, key: lt.key } },
      create: { companyId: company.id, isSystem: true, isRequired: true, isActive: true, ...lt },
      update: { name: lt.name, isActive: true },
    });
  }
  console.log(`  ✓ ${company.name}`);
}
console.log("완료!");
await prisma.$disconnect();
