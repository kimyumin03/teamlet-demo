/**
 * 자동부여 엔진 직접 테스트 — 근로기준법 §60 검증용
 * 권한 우회해서 실제 계산 로직만 검증
 */
import { PrismaClient } from "../packages/db/generated/client/index.js";
const p = new PrismaClient({ datasources: { db: { url: "postgresql://teamlet:teamlet@localhost:5432/teamlet?schema=public" } } });

// 법정 일수 계산 (auto-grant.ts와 동일 로직)
function completedMonthsAsOf(hireDate, grantYear) {
  const hireTotalMonths = hireDate.getFullYear() * 12 + hireDate.getMonth();
  const jan1TotalMonths = grantYear * 12;
  const delta = jan1TotalMonths - hireTotalMonths;
  return Math.max(0, hireDate.getDate() > 1 ? delta - 1 : delta);
}

function legalAnnualDays(tenureYears) {
  if (tenureYears < 1) return 11;
  const bonus = tenureYears >= 3 ? Math.floor((tenureYears - 1) / 2) : 0;
  return Math.min(25, 15 + bonus);
}

function entitledDays(base, hireDate, grantYear) {
  if (!hireDate) return Math.ceil(base);
  const hireYear = hireDate.getFullYear();
  if (hireYear > grantYear) return 0;
  if (hireYear === grantYear) {
    const monthsInYear = 12 - hireDate.getMonth();
    return Math.ceil((base * monthsInYear) / 12);
  }
  return Math.ceil(base);
}

const YEAR = 2026;

// 데모 회사 구성원 조회
const company = await p.company.findFirst({ where: { name: { contains: "데모" } }, select: { id: true, name: true } });
const employees = await p.employee.findMany({
  where: { companyId: company.id, isActive: true },
  select: { id: true, name: true, hireDate: true },
});

console.log(`\n=== ${company.name} — ${YEAR}년 연차 부여 예상 (근로기준법 §60) ===`);
console.log("이름".padEnd(12), "입사일".padEnd(12), "만 근속월".padEnd(8), "만 근속연".padEnd(8), "기준 일수".padEnd(8), "부여 일수");
console.log("-".repeat(65));

for (const emp of employees) {
  const hireDate = emp.hireDate ? new Date(emp.hireDate) : null;
  const months = hireDate ? completedMonthsAsOf(hireDate, YEAR) : 12;
  const tenureYears = Math.floor(months / 12);
  const base = legalAnnualDays(tenureYears);
  const granted = entitledDays(base, hireDate, YEAR);

  const hireDateStr = hireDate ? hireDate.toISOString().slice(0, 10) : "미상";
  console.log(emp.name.padEnd(12), hireDateStr.padEnd(12), String(months).padEnd(8), String(tenureYears).padEnd(8), String(base).padEnd(8), String(granted) + "일");
}

await p.$disconnect();
