/**
 * 기존 회사에 누락/신규 법정·기본 휴가 타입 일괄 upsert.
 * 신규 회사는 bootstrapCompanyLeaveTypes에서 자동 처리됨.
 *
 * 실행: node scripts/seed-statutory.mjs
 */
import { PrismaClient } from "../packages/db/generated/client/index.js";

const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://teamlet:teamlet@localhost:5432/teamlet?schema=public" } },
});

const ALL_TYPES = [
  // ── 법정 필수 ─────────────────────────────────────────────────────────────
  { key: "annual", name: "연차", description: "연차유급휴가 (정책 기반 자동 부여)", grantMethod: "PERIODIC", grantUnit: "DAY", grantAmount: null, paymentType: "PAID", genderRestriction: "ALL", evidenceRequirement: "NONE", isRequired: true },
  { key: "family_care", name: "가족돌봄", description: "가족의 질병·사고·노령 또는 자녀 양육 사유 (연 최대 10일, 무급)", grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: 10, paymentType: "UNPAID", genderRestriction: "ALL", evidenceRequirement: "AFTER", isRequired: true },
  { key: "military_training", name: "군소집훈련", description: "예비군·민방위 등 법정 소집 훈련 (소집 기간, 유급)", grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: null, paymentType: "PAID", genderRestriction: "ALL", evidenceRequirement: "BEFORE", isRequired: true },
  { key: "infertility", name: "난임 치료", description: "난임 치료 시술 (매년 6일 부여, 최초 2일 유급)", grantMethod: "PERIODIC", grantUnit: "DAY", grantAmount: 6, paymentType: "PARTIAL_PAID", genderRestriction: "ALL", evidenceRequirement: "AFTER", isRequired: true },
  { key: "spouse_childbirth", name: "배우자출산", description: "배우자 출산 (20일, 유급)", grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: 20, paymentType: "PAID", genderRestriction: "ALL", evidenceRequirement: "AFTER", isRequired: true },
  { key: "menstrual", name: "보건", description: "여성 보건 (매월 1일 부여, 무급)", grantMethod: "PERIODIC", grantUnit: "DAY", grantAmount: 1, paymentType: "UNPAID", genderRestriction: "FEMALE", evidenceRequirement: "NONE", isRequired: true },
  { key: "maternity_self", name: "산전후 - 본인", description: "출산 전후 휴가 (90일, 유급)", grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: 90, paymentType: "PAID", genderRestriction: "FEMALE", evidenceRequirement: "BEFORE", isRequired: true },
  { key: "maternity_premature", name: "산전후 - 미숙아", description: "미숙아 출산 시 산전후 휴가 연장 (100일, 유급)", grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: 100, paymentType: "PAID", genderRestriction: "FEMALE", evidenceRequirement: "BEFORE", isRequired: true },
  { key: "maternity_multiple", name: "산전후 - 본인 (다태아)", description: "다태아 출산 전후 휴가 (120일, 유급)", grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: 120, paymentType: "PAID", genderRestriction: "FEMALE", evidenceRequirement: "BEFORE", isRequired: true },
  { key: "miscarriage", name: "유산·사산", description: "유산 또는 사산 시 (임신 주수에 따라 5~90일, 유급)", grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: null, paymentType: "PAID", genderRestriction: "FEMALE", evidenceRequirement: "BEFORE", isRequired: true },
  { key: "miscarriage_multiple", name: "유산·사산 (다태아)", description: "다태아 임신 중 유산 또는 사산 시 (임신 주수+15일, 유급)", grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: null, paymentType: "PAID", genderRestriction: "FEMALE", evidenceRequirement: "BEFORE", isRequired: true },
  // ── 회사 기본 제공 ─────────────────────────────────────────────────────────
  { key: "compensatory", name: "보상", description: "연장·야간·휴일 근로에 대한 보상 휴가 (관리자가 직접 부여)", grantMethod: "MANUAL", grantUnit: "HOUR", grantAmount: null, paymentType: "PAID", genderRestriction: "ALL", evidenceRequirement: "NONE", isRequired: false },
  { key: "marriage_self", name: "결혼 - 본인", description: "본인 결혼 경조사 (5일, 유급)", grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: 5, paymentType: "PAID", genderRestriction: "ALL", evidenceRequirement: "AFTER", isRequired: false },
  { key: "marriage_child", name: "결혼 - 자녀", description: "자녀 결혼 경조사 (1일, 유급)", grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: 1, paymentType: "PAID", genderRestriction: "ALL", evidenceRequirement: "AFTER", isRequired: false },
  { key: "refresh", name: "리프레시", description: "장기 근속 리프레시 휴가 (근속 시 30일 부여, 유급)", grantMethod: "ON_TENURE", grantUnit: "DAY", grantAmount: 30, paymentType: "PAID", genderRestriction: "ALL", evidenceRequirement: "NONE", isRequired: false },
  { key: "sick_leave", name: "병가", description: "질병·부상 치료 (연차 소진 후 최대 60일 부여, 유급)", grantMethod: "ON_OTHER_EXHAUSTED", grantUnit: "DAY", grantAmount: 60, paymentType: "PAID", genderRestriction: "ALL", evidenceRequirement: "AFTER", isRequired: false },
  { key: "emergency", name: "비상", description: "긴급 개인 사유 (1일, 유급)", grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: 1, paymentType: "PAID", genderRestriction: "ALL", evidenceRequirement: "NONE", isRequired: false },
  { key: "bereavement_close", name: "조의 - 부모/배우자/자녀", description: "부모·배우자·자녀 사망 경조사 (5일, 유급)", grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: 5, paymentType: "PAID", genderRestriction: "ALL", evidenceRequirement: "AFTER", isRequired: false },
  { key: "bereavement_extended", name: "조의 - 조부모/형제/자매", description: "조부모·형제·자매 사망 경조사 (3일, 유급)", grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: 3, paymentType: "PAID", genderRestriction: "ALL", evidenceRequirement: "AFTER", isRequired: false },
  { key: "award", name: "포상", description: "포상 휴가 (관리자가 직접 부여)", grantMethod: "MANUAL", grantUnit: "DAY", grantAmount: null, paymentType: "PAID", genderRestriction: "ALL", evidenceRequirement: "NONE", isRequired: false },
];

const companies = await prisma.company.findMany({ select: { id: true, name: true } });
console.log(`${companies.length}개 회사에 휴가 타입 ${ALL_TYPES.length}종 upsert 중...`);

for (const company of companies) {
  for (const lt of ALL_TYPES) {
    await prisma.leaveType.upsert({
      where: { companyId_key: { companyId: company.id, key: lt.key } },
      create: { companyId: company.id, isSystem: true, isActive: true, ...lt },
      update: { name: lt.name, description: lt.description, grantMethod: lt.grantMethod, isRequired: lt.isRequired, grantAmount: lt.grantAmount ?? null },
    });
  }
  console.log(`  ✓ ${company.name}`);
}
console.log("완료!");
await prisma.$disconnect();
