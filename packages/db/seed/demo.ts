/**
 * 데모 시드 — 테스트·개발 환경 전용. pnpm db:seed 에서 NODE_ENV !== "production" 시 실행.
 * idempotent: DEMO-0001 코드 회사가 이미 있으면 건너뜀.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ 계정 (비밀번호: Test1234!)                                                │
 * │   admin@teamlet.test → 최고 관리자 / 경영지원팀 대표이사                  │
 * │   hr@teamlet.test    → 인사팀 팀장 (HR 관리자 권한)                       │
 * │   emp@teamlet.test   → 개발팀 팀원 (일반 권한)                            │
 * │                                                                           │
 * │ 체험 시나리오:                                                             │
 * │   S1. admin 로그인 → 홈 → 전체 구성원 13명 확인                           │
 * │   S2. admin 결재함 → emp 휴가 신청 PENDING → 승인                         │
 * │   S3. HR 휴가 관리 → 13명 잔여 현황 / 종류별 필터                         │
 * │   S4. 맞춤 휴가 부여 → 병가 부여 테스트                                    │
 * │   S5. 구성원 상세 → 발령 탭 → HIRE 내역                                   │
 * │   S6. 연차 조정 (이월·추가·차감)                                           │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

import type { PrismaClient } from "../generated/client/index.js";
import { scrypt as _scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import { KR_STATUTORY_LEAVE_TYPES } from "./leave-types.js";
import { seedCompanyHolidays } from "./holidays-sync.js";

async function bootstrapLeaveTypes(prisma: PrismaClient, companyId: string): Promise<number> {
  // 법정 필수(isRequired)만 기본 등록 — 선택 휴가는 "법정의무휴가 추가"/"맞춤 휴가"로 별도 추가
  const results = await Promise.all(
    KR_STATUTORY_LEAVE_TYPES.filter((lt) => lt.isRequired).map((lt) =>
      prisma.leaveType.upsert({
        where: { companyId_key: { companyId, key: lt.key } },
        create: { companyId, key: lt.key, name: lt.name, description: lt.description, isSystem: lt.isSystem, isRequired: lt.isRequired, grantMethod: lt.grantMethod, grantUnit: lt.grantUnit, grantAmount: lt.grantAmount ?? null, periodicCycle: lt.periodicCycle ?? null, paymentType: lt.paymentType, partialPayDays: lt.partialPayDays ?? null, deductOnHoliday: lt.deductOnHoliday ?? false, genderRestriction: lt.genderRestriction, evidenceRequirement: lt.evidenceRequirement },
        update: { name: lt.name, description: lt.description, isSystem: lt.isSystem, isRequired: lt.isRequired, grantMethod: lt.grantMethod, grantUnit: lt.grantUnit, grantAmount: lt.grantAmount ?? null, paymentType: lt.paymentType, partialPayDays: lt.partialPayDays ?? null, deductOnHoliday: lt.deductOnHoliday ?? false, genderRestriction: lt.genderRestriction, evidenceRequirement: lt.evidenceRequirement },
        select: { id: true },
      }),
    ),
  );
  return results.length;
}

const scryptAsync = promisify(_scrypt);
const KEYLEN = 64;
const COST = 16384;

async function hashPw(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(plain, salt, KEYLEN)) as Buffer;
  return `scrypt$${COST}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

const DEMO_PW = "Test1234!";
const COMPANY_CODE = "DEMO-0001";
const BUSINESS_NUMBER = "000-00-00000";

const DEFAULT_ROLE_KEYS = [
  "member.directory.read",
  "leave.balance.read",
  "workflow.document.read",
  "company.basic_info.read",
];

const ORG_HEAD_ROLE_KEYS = [
  "member.directory.read",
  "member.hr_info.read",
  "leave.balance.read",
  "workflow.document.read",
];

/** hireDate 기준 연차일수 (근속 1년 미만=11일, 이후 1년마다 +1, 최대 25일) */
function calcAnnualDays(hireDate: Date, year: number): number {
  const refDate = new Date(year, 11, 31);
  const months =
    (refDate.getFullYear() - hireDate.getFullYear()) * 12 +
    (refDate.getMonth() - hireDate.getMonth());
  if (months < 12) return 11;
  const years = Math.floor(months / 12);
  // 근로기준법 §60: 1년 15일, 3년차부터 2년마다 +1일, 최대 25일 (부여 엔진 legalAnnualDays 와 동일)
  const bonus = years >= 3 ? Math.floor((years - 1) / 2) : 0;
  return Math.min(25, 15 + bonus);
}

export async function seedDemoData(prisma: PrismaClient): Promise<void> {
  const exists = await prisma.company.findUnique({ where: { companyCode: COMPANY_CODE } });
  if (exists) {
    // 멱등 보강 — DB 리셋 없이 `pnpm db:seed` 만으로 기존 데모 회사에 누락분을 채운다.
    const count = await bootstrapLeaveTypes(prisma, exists.id);

    const annual = await prisma.leaveType.findFirst({
      where: { companyId: exists.id, key: "annual" },
      select: { id: true },
    });
    if (annual) {
      const hasDefault = await prisma.leavePolicy.findFirst({
        where: { companyId: exists.id, isDefault: true },
        select: { id: true },
      });
      if (!hasDefault) {
        await prisma.leavePolicy.create({
          data: { companyId: exists.id, name: "기본 연차 정책", leaveTypeId: annual.id, isDefault: true, isActive: true },
        });
      }
    }

    const y = new Date().getFullYear();
    const holi = await seedCompanyHolidays(prisma, exists.id, [y, y + 1]);
    console.log(`  ✔ 법정 휴가 ${count}종 / 기본 정책·공휴일 ${holi.added}건(${holi.source}) 보강 (DEMO-0001)`);
    return;
  }

  const pw = await hashPw(DEMO_PW);
  const year = new Date().getFullYear();

  // ── 0. 플랫폼 운영자 ──────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "platform@teamlet.test" },
    create: { email: "platform@teamlet.test", name: "플랫폼관리자", passwordHash: pw, emailVerified: true },
    update: {},
  });

  // ── 1. 로그인 가능 유저 3명 ───────────────────────────────────────────────
  const [adminU, hrU, empU] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@teamlet.test" },
      create: { email: "admin@teamlet.test", name: "김관리", passwordHash: pw, emailVerified: true },
      update: {},
      select: { id: true },
    }),
    prisma.user.upsert({
      where: { email: "hr@teamlet.test" },
      create: { email: "hr@teamlet.test", name: "이인사", passwordHash: pw, emailVerified: true },
      update: {},
      select: { id: true },
    }),
    prisma.user.upsert({
      where: { email: "emp@teamlet.test" },
      create: { email: "emp@teamlet.test", name: "박사원", passwordHash: pw, emailVerified: true },
      update: {},
      select: { id: true },
    }),
  ]);

  // ── 2. 회사 ───────────────────────────────────────────────────────────────
  const company = await prisma.company.create({
    data: {
      name: "Teamlet 데모 주식회사",
      businessNumber: BUSINESS_NUMBER,
      companyCode: COMPANY_CODE,
      joinPolicy: "REQUIRE_APPROVAL",
      isSetupCompleted: true,
    },
    select: { id: true },
  });
  const cid = company.id;

  // ── 3. 부서 (5개) ─────────────────────────────────────────────────────────
  const [devDept, designDept, mktDept, hrDept, finDept] = await Promise.all([
    prisma.department.create({ data: { companyId: cid, name: "개발팀" }, select: { id: true, name: true } }),
    prisma.department.create({ data: { companyId: cid, name: "디자인팀" }, select: { id: true, name: true } }),
    prisma.department.create({ data: { companyId: cid, name: "마케팅팀" }, select: { id: true, name: true } }),
    prisma.department.create({ data: { companyId: cid, name: "인사팀" }, select: { id: true, name: true } }),
    prisma.department.create({ data: { companyId: cid, name: "경영지원팀" }, select: { id: true, name: true } }),
  ]);

  // ── 4. 직책 (5개) ─────────────────────────────────────────────────────────
  const [ceoPos, leadPos, seniorPos, memberPos, internPos] = await Promise.all([
    prisma.position.create({ data: { companyId: cid, name: "대표이사" }, select: { id: true, name: true } }),
    prisma.position.create({ data: { companyId: cid, name: "팀장" }, select: { id: true, name: true } }),
    prisma.position.create({ data: { companyId: cid, name: "시니어" }, select: { id: true, name: true } }),
    prisma.position.create({ data: { companyId: cid, name: "팀원" }, select: { id: true, name: true } }),
    prisma.position.create({ data: { companyId: cid, name: "인턴" }, select: { id: true, name: true } }),
  ]);

  // ── 5. 직원 (13명) ────────────────────────────────────────────────────────
  // 계정 있는 직원 3명
  const hire20200301 = new Date("2020-03-01T00:00:00.000Z");
  const hire20210601 = new Date("2021-06-01T00:00:00.000Z");
  const hire20230101 = new Date("2023-01-01T00:00:00.000Z");

  const [adminEmp, hrEmp, empEmp] = await prisma.$transaction(async (tx) => {
    const a = await tx.employee.create({
      data: { companyId: cid, name: "김관리", hireDate: hire20200301, departmentId: finDept.id, positionId: ceoPos.id, employmentStatus: "ACTIVE" },
      select: { id: true },
    });
    const h = await tx.employee.create({
      data: { companyId: cid, name: "이인사", hireDate: hire20210601, departmentId: hrDept.id, positionId: leadPos.id, employmentStatus: "ACTIVE" },
      select: { id: true },
    });
    const e = await tx.employee.create({
      data: { companyId: cid, name: "박사원", hireDate: hire20230101, departmentId: devDept.id, positionId: memberPos.id, employmentStatus: "ACTIVE" },
      select: { id: true },
    });
    return [a, h, e];
  });

  // 계정 없는 직원 10명
  const extraEmployees = await prisma.$transaction(async (tx) => {
    // 개발팀
    const ysCho = await tx.employee.create({
      data: { companyId: cid, name: "최영수", hireDate: new Date("2021-03-15T00:00:00.000Z"), departmentId: devDept.id, positionId: leadPos.id, employmentStatus: "ACTIVE" },
      select: { id: true, name: true },
    });
    const mjKim = await tx.employee.create({
      data: { companyId: cid, name: "김민준", hireDate: new Date("2022-01-10T00:00:00.000Z"), departmentId: devDept.id, positionId: seniorPos.id, employmentStatus: "ACTIVE" },
      select: { id: true, name: true },
    });
    const syLee = await tx.employee.create({
      data: { companyId: cid, name: "이서연", hireDate: new Date("2023-06-01T00:00:00.000Z"), departmentId: devDept.id, positionId: memberPos.id, employmentStatus: "ACTIVE" },
      select: { id: true, name: true },
    });
    const dePark = await tx.employee.create({
      data: { companyId: cid, name: "정다은", hireDate: new Date("2024-01-15T00:00:00.000Z"), departmentId: devDept.id, positionId: internPos.id, employmentStatus: "ACTIVE" },
      select: { id: true, name: true },
    });
    // 디자인팀
    const sySeo = await tx.employee.create({
      data: { companyId: cid, name: "서소영", hireDate: new Date("2021-09-01T00:00:00.000Z"), departmentId: designDept.id, positionId: leadPos.id, employmentStatus: "ACTIVE" },
      select: { id: true, name: true },
    });
    const hwKang = await tx.employee.create({
      data: { companyId: cid, name: "강현우", hireDate: new Date("2022-07-01T00:00:00.000Z"), departmentId: designDept.id, positionId: memberPos.id, employmentStatus: "ACTIVE" },
      select: { id: true, name: true },
    });
    // 마케팅팀
    const naYun = await tx.employee.create({
      data: { companyId: cid, name: "윤나은", hireDate: new Date("2022-03-01T00:00:00.000Z"), departmentId: mktDept.id, positionId: leadPos.id, employmentStatus: "ACTIVE" },
      select: { id: true, name: true },
    });
    const msCho = await tx.employee.create({
      data: { companyId: cid, name: "조민서", hireDate: new Date("2023-09-01T00:00:00.000Z"), departmentId: mktDept.id, positionId: memberPos.id, employmentStatus: "ACTIVE" },
      select: { id: true, name: true },
    });
    // 인사팀
    const yjJung = await tx.employee.create({
      data: { companyId: cid, name: "정유진", hireDate: new Date("2022-11-01T00:00:00.000Z"), departmentId: hrDept.id, positionId: memberPos.id, employmentStatus: "ACTIVE" },
      select: { id: true, name: true },
    });
    // 경영지원팀
    const jmHan = await tx.employee.create({
      data: { companyId: cid, name: "한지민", hireDate: new Date("2021-06-01T00:00:00.000Z"), departmentId: finDept.id, positionId: leadPos.id, employmentStatus: "ACTIVE" },
      select: { id: true, name: true },
    });
    return [ysCho, mjKim, syLee, dePark, sySeo, hwKang, naYun, msCho, yjJung, jmHan];
  });

  const [ysCho, mjKim, syLee, dePark, sySeo, hwKang, naYun, msCho, yjJung, jmHan] = extraEmployees;

  // ── 6. 멤버십 (계정 있는 3명만) ──────────────────────────────────────────
  await prisma.$transaction([
    prisma.userCompanyMembership.create({
      data: { userId: adminU.id, companyId: cid, employeeId: adminEmp.id, status: "ACTIVE", joinPath: "APPLICATION" },
    }),
    prisma.userCompanyMembership.create({
      data: { userId: hrU.id, companyId: cid, employeeId: hrEmp.id, status: "ACTIVE", joinPath: "APPLICATION" },
    }),
    prisma.userCompanyMembership.create({
      data: { userId: empU.id, companyId: cid, employeeId: empEmp.id, status: "ACTIVE", joinPath: "APPLICATION" },
    }),
  ]);

  // ── 7. 발령 HIRE ─────────────────────────────────────────────────────────
  const hireDepts: Record<string, { deptId: string; deptName: string; posId: string; posName: string; hireDate: Date }> = {
    [adminEmp.id]: { deptId: finDept.id, deptName: finDept.name, posId: ceoPos.id, posName: ceoPos.name, hireDate: hire20200301 },
    [hrEmp.id]: { deptId: hrDept.id, deptName: hrDept.name, posId: leadPos.id, posName: leadPos.name, hireDate: hire20210601 },
    [empEmp.id]: { deptId: devDept.id, deptName: devDept.name, posId: memberPos.id, posName: memberPos.name, hireDate: hire20230101 },
    [ysCho.id]: { deptId: devDept.id, deptName: devDept.name, posId: leadPos.id, posName: leadPos.name, hireDate: new Date("2021-03-15T00:00:00.000Z") },
    [mjKim.id]: { deptId: devDept.id, deptName: devDept.name, posId: seniorPos.id, posName: seniorPos.name, hireDate: new Date("2022-01-10T00:00:00.000Z") },
    [syLee.id]: { deptId: devDept.id, deptName: devDept.name, posId: memberPos.id, posName: memberPos.name, hireDate: new Date("2023-06-01T00:00:00.000Z") },
    [dePark.id]: { deptId: devDept.id, deptName: devDept.name, posId: internPos.id, posName: internPos.name, hireDate: new Date("2024-01-15T00:00:00.000Z") },
    [sySeo.id]: { deptId: designDept.id, deptName: designDept.name, posId: leadPos.id, posName: leadPos.name, hireDate: new Date("2021-09-01T00:00:00.000Z") },
    [hwKang.id]: { deptId: designDept.id, deptName: designDept.name, posId: memberPos.id, posName: memberPos.name, hireDate: new Date("2022-07-01T00:00:00.000Z") },
    [naYun.id]: { deptId: mktDept.id, deptName: mktDept.name, posId: leadPos.id, posName: leadPos.name, hireDate: new Date("2022-03-01T00:00:00.000Z") },
    [msCho.id]: { deptId: mktDept.id, deptName: mktDept.name, posId: memberPos.id, posName: memberPos.name, hireDate: new Date("2023-09-01T00:00:00.000Z") },
    [yjJung.id]: { deptId: hrDept.id, deptName: hrDept.name, posId: memberPos.id, posName: memberPos.name, hireDate: new Date("2022-11-01T00:00:00.000Z") },
    [jmHan.id]: { deptId: finDept.id, deptName: finDept.name, posId: leadPos.id, posName: leadPos.name, hireDate: new Date("2021-06-01T00:00:00.000Z") },
  };

  await prisma.appointment.createMany({
    data: Object.entries(hireDepts).map(([eid, d]) => ({
      companyId: cid,
      employeeId: eid,
      kind: "HIRE",
      effectiveDate: d.hireDate,
      toDepartmentId: d.deptId,
      toDepartmentName: d.deptName,
      toPositionId: d.posId,
      toPositionName: d.posName,
      appointedByName: "시스템",
    })),
  });

  // ── 8. 역할 부트스트랩 ────────────────────────────────────────────────────
  const [superAdminRole, orgHeadRole, hrAdminRole, defaultRole] = await Promise.all([
    prisma.role.create({ data: { companyId: cid, name: "최고 관리자", type: "SYSTEM_SUPER_ADMIN", isSystem: true, description: "전체 권한 보유" }, select: { id: true } }),
    prisma.role.create({ data: { companyId: cid, name: "조직장", type: "DYNAMIC_ORG_HEAD", isSystem: true, description: "조직장 직책 자동 매핑" }, select: { id: true } }),
    prisma.role.create({ data: { companyId: cid, name: "HR 관리자", type: "CUSTOM", isSystem: false, description: "인사·휴가 관리 권한" }, select: { id: true } }),
    prisma.role.create({ data: { companyId: cid, name: "기본", type: "DEFAULT", isSystem: true, description: "구성원 기본 역할" }, select: { id: true } }),
  ]);

  const allPerms = await prisma.permission.findMany({ select: { id: true, key: true, hasScope: true } });
  if (allPerms.length > 0) {
    // 최고 관리자 → 전체 권한
    await prisma.rolePermission.createMany({
      data: allPerms.map((p) => ({ roleId: superAdminRole.id, permissionId: p.id, enabled: true, scopeType: p.hasScope ? "ALL" : null })),
      skipDuplicates: true,
    });

    // 조직장 → 부서 스코프
    const orgHeadPerms = allPerms.filter((p) => ORG_HEAD_ROLE_KEYS.includes(p.key));
    await prisma.rolePermission.createMany({
      data: orgHeadPerms.map((p) => ({ roleId: orgHeadRole.id, permissionId: p.id, enabled: true, scopeType: "DEPARTMENT" })),
      skipDuplicates: true,
    });

    // HR 관리자 → 인사/휴가 관리 권한
    const hrKeys = ["member.directory.read", "member.hr_info.read", "leave.balance.read", "leave.balance.manage", "workflow.document.read", "workflow.document.manage", "company.basic_info.read"];
    const hrPerms = allPerms.filter((p) => hrKeys.includes(p.key));
    await prisma.rolePermission.createMany({
      data: hrPerms.map((p) => ({ roleId: hrAdminRole.id, permissionId: p.id, enabled: true, scopeType: p.hasScope ? "ALL" : null })),
      skipDuplicates: true,
    });

    // DEFAULT → 기본 조회
    const defaultPerms = allPerms.filter((p) => DEFAULT_ROLE_KEYS.includes(p.key));
    await prisma.rolePermission.createMany({
      data: defaultPerms.map((p) => ({ roleId: defaultRole.id, permissionId: p.id, enabled: true, scopeType: p.hasScope ? "ALL" : null })),
      skipDuplicates: true,
    });
  }

  await prisma.userRole.createMany({
    data: [
      { employeeId: adminEmp.id, roleId: superAdminRole.id },
      { employeeId: adminEmp.id, roleId: orgHeadRole.id },
      { employeeId: hrEmp.id, roleId: hrAdminRole.id },
      { employeeId: hrEmp.id, roleId: defaultRole.id },
      { employeeId: empEmp.id, roleId: defaultRole.id },
      // 팀장급 → 조직장 역할
      { employeeId: ysCho.id, roleId: orgHeadRole.id },
      { employeeId: sySeo.id, roleId: orgHeadRole.id },
      { employeeId: naYun.id, roleId: orgHeadRole.id },
      { employeeId: jmHan.id, roleId: orgHeadRole.id },
    ],
    skipDuplicates: true,
  });

  // ── 9. 휴가 종류 (3종) ────────────────────────────────────────────────────
  const [annualLeave, sickLeave, condolenceLeave] = await Promise.all([
    prisma.leaveType.create({
      data: { companyId: cid, key: "annual", name: "연차", grantMethod: "PERIODIC", grantUnit: "DAY", grantAmount: 15, paymentType: "PAID", isActive: true, isRequired: true, isSystem: true },
      select: { id: true, name: true },
    }),
    prisma.leaveType.create({
      data: { companyId: cid, key: "sick", name: "병가", grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: 60, paymentType: "UNPAID", isActive: true },
      select: { id: true, name: true },
    }),
    prisma.leaveType.create({
      data: { companyId: cid, key: "condolence", name: "경조사 휴가", grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: 5, paymentType: "PAID", isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  // ── 9.5. 기본 연차 정책 (teamlet 표준 — 부여 엔진이 미배정 구성원에 자동 적용) ──
  await prisma.leavePolicy.create({
    data: {
      companyId: cid,
      name: "기본 연차 정책",
      leaveTypeId: annualLeave.id,
      isDefault: true,
      isActive: true,
      approverEmployeeId: adminEmp.id,
    },
  });

  // ── 10. 연차 잔여 (전 직원 — 기본 정책 부여 엔진과 동일 규칙·멱등키) ───────────
  type BalanceSeed = { eid: string; hireDate: Date; usedDays?: number };
  const balanceSeeds: BalanceSeed[] = [
    { eid: adminEmp.id, hireDate: hire20200301, usedDays: 3 },
    { eid: hrEmp.id, hireDate: hire20210601, usedDays: 1 },
    { eid: empEmp.id, hireDate: hire20230101, usedDays: 0 },
    { eid: ysCho.id, hireDate: new Date("2021-03-15T00:00:00.000Z"), usedDays: 2 },
    { eid: mjKim.id, hireDate: new Date("2022-01-10T00:00:00.000Z"), usedDays: 5 },
    { eid: syLee.id, hireDate: new Date("2023-06-01T00:00:00.000Z"), usedDays: 0 },
    { eid: dePark.id, hireDate: new Date("2024-01-15T00:00:00.000Z"), usedDays: 0 },
    { eid: sySeo.id, hireDate: new Date("2021-09-01T00:00:00.000Z"), usedDays: 4 },
    { eid: hwKang.id, hireDate: new Date("2022-07-01T00:00:00.000Z"), usedDays: 1 },
    { eid: naYun.id, hireDate: new Date("2022-03-01T00:00:00.000Z"), usedDays: 2 },
    { eid: msCho.id, hireDate: new Date("2023-09-01T00:00:00.000Z"), usedDays: 0 },
    { eid: yjJung.id, hireDate: new Date("2022-11-01T00:00:00.000Z"), usedDays: 1 },
    { eid: jmHan.id, hireDate: new Date("2021-06-01T00:00:00.000Z"), usedDays: 3 },
  ];

  // note = "{year}년 정기 부여" 로 부여 엔진 멱등키와 정합 → 재부여 시 중복 안 됨
  const grantNote = `${year}년 정기 부여`;
  await prisma.$transaction(
    balanceSeeds.flatMap(({ eid, hireDate, usedDays = 0 }) => {
      const granted = calcAnnualDays(hireDate, year);
      return [
        prisma.leaveBalance.create({ data: { employeeId: eid, leaveTypeId: annualLeave.id, year, grantedDays: granted, usedDays } }),
        prisma.leaveTransaction.create({ data: { employeeId: eid, leaveTypeId: annualLeave.id, category: "ANNUAL", txType: "GRANT", days: granted, reason: "연차 자동부여", note: grantNote } }),
        ...(usedDays > 0
          ? [prisma.leaveTransaction.create({ data: { employeeId: eid, leaveTypeId: annualLeave.id, category: "ANNUAL", txType: "USE", days: usedDays, reason: "연차 사용" } })]
          : []),
      ];
    }),
  );

  // ── 11. hr 과거 승인 휴가 (S3: 잔여 검증용) ──────────────────────────────
  const pastDate = new Date("2024-03-15T00:00:00.000Z");
  const pastDateStr = "2024-03-15";
  const approvedAt = new Date("2024-03-14T10:00:00.000Z");

  await prisma.$transaction(async (tx) => {
    const hrDoc = await tx.formDocument.create({
      data: {
        companyId: cid,
        authorId: hrEmp.id,
        title: `휴가 신청 — 연차 ${pastDateStr}~${pastDateStr} (1일)`,
        kind: "LEAVE_REQUEST",
        formData: { leaveTypeId: annualLeave.id, leaveTypeName: annualLeave.name, startDate: pastDateStr, endDate: pastDateStr, days: 1, reason: "개인 용무" },
        status: "APPROVED",
      },
      select: { id: true },
    });
    await tx.approvalLine.create({ data: { documentId: hrDoc.id, step: 1, approverId: adminEmp.id, status: "APPROVED", approvedAt } });
    await tx.leaveRequest.create({
      data: { employeeId: hrEmp.id, leaveTypeId: annualLeave.id, startDate: pastDate, endDate: pastDate, days: 1, reason: "개인 용무", status: "APPROVED", reviewedAt: approvedAt, reviewedBy: adminEmp.id, formDocumentId: hrDoc.id },
    });
  });

  // ── 12. emp PENDING 휴가 신청 (S2: admin 결재 대기) ──────────────────────
  const pendingLeaveDate = new Date();
  pendingLeaveDate.setDate(pendingLeaveDate.getDate() + 7);
  pendingLeaveDate.setHours(0, 0, 0, 0);
  const pendingLeaveDateStr = pendingLeaveDate.toISOString().slice(0, 10);

  await prisma.$transaction(async (tx) => {
    const empDoc = await tx.formDocument.create({
      data: {
        companyId: cid,
        authorId: empEmp.id,
        title: `휴가 신청 — 연차 ${pendingLeaveDateStr}~${pendingLeaveDateStr} (1일)`,
        kind: "LEAVE_REQUEST",
        formData: { leaveTypeId: annualLeave.id, leaveTypeName: annualLeave.name, startDate: pendingLeaveDateStr, endDate: pendingLeaveDateStr, days: 1, reason: "개인 사정" },
        status: "IN_PROGRESS",
      },
      select: { id: true },
    });
    await tx.approvalLine.create({ data: { documentId: empDoc.id, step: 1, approverId: adminEmp.id, status: "PENDING" } });
    await tx.leaveRequest.create({
      data: { employeeId: empEmp.id, leaveTypeId: annualLeave.id, startDate: pendingLeaveDate, endDate: pendingLeaveDate, days: 1, reason: "개인 사정", status: "PENDING", formDocumentId: empDoc.id },
    });
  });

  // ── 13. 추가 결재 이력 (다양한 상태) ─────────────────────────────────────
  // 최영수 — 연차 2일 승인 (2024년)
  const d1 = new Date("2024-07-22T00:00:00.000Z");
  const d2 = new Date("2024-07-23T00:00:00.000Z");
  await prisma.$transaction(async (tx) => {
    const doc = await tx.formDocument.create({
      data: { companyId: cid, authorId: ysCho.id, title: "휴가 신청 — 연차 2024-07-22~2024-07-23 (2일)", kind: "LEAVE_REQUEST", formData: { leaveTypeId: annualLeave.id, startDate: "2024-07-22", endDate: "2024-07-23", days: 2, reason: "가족 여행" }, status: "APPROVED" },
      select: { id: true },
    });
    await tx.approvalLine.create({ data: { documentId: doc.id, step: 1, approverId: adminEmp.id, status: "APPROVED", approvedAt: new Date("2024-07-20T09:00:00.000Z") } });
    await tx.leaveRequest.create({ data: { employeeId: ysCho.id, leaveTypeId: annualLeave.id, startDate: d1, endDate: d2, days: 2, reason: "가족 여행", status: "APPROVED", reviewedAt: new Date("2024-07-20T09:00:00.000Z"), reviewedBy: adminEmp.id, formDocumentId: doc.id } });
  });

  // 정다은 — 연차 반려 (중요 일정 겹침)
  const d3 = new Date("2024-08-15T00:00:00.000Z");
  await prisma.$transaction(async (tx) => {
    const doc = await tx.formDocument.create({
      data: { companyId: cid, authorId: dePark.id, title: "휴가 신청 — 연차 2024-08-15 (1일)", kind: "LEAVE_REQUEST", formData: { leaveTypeId: annualLeave.id, startDate: "2024-08-15", endDate: "2024-08-15", days: 1, reason: "개인 사정" }, status: "REJECTED" },
      select: { id: true },
    });
    await tx.approvalLine.create({ data: { documentId: doc.id, step: 1, approverId: adminEmp.id, status: "REJECTED", approvedAt: new Date("2024-08-10T14:00:00.000Z") } });
    await tx.leaveRequest.create({ data: { employeeId: dePark.id, leaveTypeId: annualLeave.id, startDate: d3, endDate: d3, days: 1, reason: "개인 사정", status: "REJECTED", reviewedAt: new Date("2024-08-10T14:00:00.000Z"), reviewedBy: adminEmp.id, formDocumentId: doc.id } });
  });

  // 병가 부여 — 서소영 5일 (맞춤 부여 시연용)
  await prisma.$transaction([
    prisma.leaveBalance.create({ data: { employeeId: sySeo.id, leaveTypeId: sickLeave.id, year, grantedDays: 5, usedDays: 0 } }),
    prisma.leaveTransaction.create({ data: { employeeId: sySeo.id, leaveTypeId: sickLeave.id, category: "EXTRA_GRANT", txType: "GRANT", days: 5, reason: "병가 처방 (진단서 제출 확인)" } }),
  ]);

  // 경조사 휴가 부여 — 김민준 3일 (결혼)
  await prisma.$transaction([
    prisma.leaveBalance.create({ data: { employeeId: mjKim.id, leaveTypeId: condolenceLeave.id, year, grantedDays: 3, usedDays: 0 } }),
    prisma.leaveTransaction.create({ data: { employeeId: mjKim.id, leaveTypeId: condolenceLeave.id, category: "EXTRA_GRANT", txType: "GRANT", days: 3, reason: "경조사 — 본인 결혼" } }),
  ]);

  // ── 공휴일 (올해·내년 — 특일정보 API 우선, 양력 fallback) ──
  const holi = await seedCompanyHolidays(prisma, cid, [year, year + 1]);

  console.log(`  ✔ 데모 회사 생성: ${cid}`);
  console.log("  ✔ 부서: 개발팀·디자인팀·마케팅팀·인사팀·경영지원팀 (5개)");
  console.log("  ✔ 직원: 13명 (계정 있는 3명 + 계정 없는 10명)");
  console.log("  ✔ 계정: admin@teamlet.test · hr@teamlet.test · emp@teamlet.test (Test1234!)");
  console.log("  ✔ 휴가 종류: 연차·병가·경조사 (3종) / 기본 연차 정책 / 공휴일 " + `${holi.added}건(${holi.source})`);
  console.log("  ✔ 결재 대기: emp→admin 연차 1건 / 승인 이력: hr·최영수 / 반려: 정다은");
}
