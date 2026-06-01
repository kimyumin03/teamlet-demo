/**
 * 데모 시드 — 테스트·개발 환경 전용. pnpm db:seed 에서 NODE_ENV !== "production" 시 실행.
 * idempotent: 이미 데이터가 있으면 건너뜀.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ 계정 (비밀번호: Test1234!)                                           │
 * │   admin@teamlet.test → 최고 관리자 + 조직장(개발팀) / 연차 15일       │
 * │   hr@teamlet.test    → 인사팀 팀원(DEFAULT 역할) / 연차 14일 (1일 사용)│
 * │   emp@teamlet.test   → 개발팀 팀원(DEFAULT 역할) / 연차 15일          │
 * │                         └ 연차 1일 결재 대기 중 → admin이 결재        │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * 검증 가능한 시나리오:
 *   S1. 세 계정 로그인 → 홈 이동
 *   S2. admin 결재함 → emp 휴가 신청 1건 PENDING 확인 → 승인 → emp 잔여 14일
 *   S3. hr 휴가 현황 → 이미 1일 사용(APPROVED 이력) → 잔여 14일 표시
 *   S4. 구성원 목록 — 세 계정 모두 조회 가능 (DEFAULT 권한)
 *   S5. admin 구성원 상세 → 발령 탭 → HIRE 내역 확인
 *   S6. 설정 → 개인 보안 → 2FA 설정 (QR 등록 후 로그인 테스트)
 */

import type { PrismaClient } from "../generated/client/index.js";
import { scrypt as _scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";

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
const LEAVE_KEY = "annual";

/** DEFAULT 역할이 갖는 기본 권한 키 목록 */
const DEFAULT_ROLE_KEYS = [
  "member.directory.read",
  "leave.balance.read",
  "workflow.document.read",
  "company.basic_info.read",
];

/** 조직장 역할 권한 키 목록 */
const ORG_HEAD_ROLE_KEYS = [
  "member.directory.read",
  "member.hr_info.read",
  "leave.balance.read",
  "workflow.document.read",
];

export async function seedDemoData(prisma: PrismaClient): Promise<void> {
  // ── 이미 시드됐으면 건너뜀 ───────────────────────────────────────
  const exists = await prisma.company.findUnique({ where: { companyCode: COMPANY_CODE } });
  if (exists) {
    console.log("  ℹ 데모 데이터 이미 존재 — 건너뜀");
    return;
  }

  const pw = await hashPw(DEMO_PW);

  // ── 0. 플랫폼 운영자 (회사 신청 승인권자 — /admin 콘솔) ───────────
  await prisma.user.upsert({
    where: { email: "platform@teamlet.test" },
    create: { email: "platform@teamlet.test", name: "플랫폼관리자", passwordHash: pw, emailVerified: true },
    update: {},
  });

  // ── 1. 유저 ─────────────────────────────────────────────────────
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

  // ── 2. 회사 ─────────────────────────────────────────────────────
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

  // ── 3. 부서 ─────────────────────────────────────────────────────
  const [devDept, hrDept] = await Promise.all([
    prisma.department.create({ data: { companyId: cid, name: "개발팀" }, select: { id: true, name: true } }),
    prisma.department.create({ data: { companyId: cid, name: "인사팀" }, select: { id: true, name: true } }),
  ]);

  // ── 4. 직책 ─────────────────────────────────────────────────────
  const [leaderPos, memberPos] = await Promise.all([
    prisma.position.create({ data: { companyId: cid, name: "팀장" }, select: { id: true, name: true } }),
    prisma.position.create({ data: { companyId: cid, name: "팀원" }, select: { id: true, name: true } }),
  ]);

  // ── 5. 직원 ─────────────────────────────────────────────────────
  const hireDate = new Date("2023-01-01T00:00:00.000Z");

  const [adminEmp, hrEmp, empEmp] = await prisma.$transaction(async (tx) => {
    const a = await tx.employee.create({
      data: { companyId: cid, name: "김관리", hireDate, departmentId: devDept.id, positionId: leaderPos.id, employmentStatus: "ACTIVE" },
      select: { id: true },
    });
    const h = await tx.employee.create({
      data: { companyId: cid, name: "이인사", hireDate, departmentId: hrDept.id, positionId: memberPos.id, employmentStatus: "ACTIVE" },
      select: { id: true },
    });
    const e = await tx.employee.create({
      data: { companyId: cid, name: "박사원", hireDate, departmentId: devDept.id, positionId: memberPos.id, employmentStatus: "ACTIVE" },
      select: { id: true },
    });
    return [a, h, e];
  });

  // ── 6. 멤버십 ────────────────────────────────────────────────────
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

  // ── 7. 발령 (HIRE) ────────────────────────────────────────────────
  await prisma.appointment.createMany({
    data: [
      { companyId: cid, employeeId: adminEmp.id, kind: "HIRE", effectiveDate: hireDate, toDepartmentId: devDept.id, toDepartmentName: devDept.name, toPositionId: leaderPos.id, toPositionName: leaderPos.name, appointedByName: "시스템" },
      { companyId: cid, employeeId: hrEmp.id, kind: "HIRE", effectiveDate: hireDate, toDepartmentId: hrDept.id, toDepartmentName: hrDept.name, toPositionId: memberPos.id, toPositionName: memberPos.name, appointedByName: "시스템" },
      { companyId: cid, employeeId: empEmp.id, kind: "HIRE", effectiveDate: hireDate, toDepartmentId: devDept.id, toDepartmentName: devDept.name, toPositionId: memberPos.id, toPositionName: memberPos.name, appointedByName: "시스템" },
    ],
  });

  // ── 8. 역할 부트스트랩 ─────────────────────────────────────────────
  const [superAdminRole, orgHeadRole, defaultRole] = await Promise.all([
    prisma.role.create({ data: { companyId: cid, name: "최고 관리자", type: "SYSTEM_SUPER_ADMIN", isSystem: true, description: "전사 권한 보유" }, select: { id: true } }),
    prisma.role.create({ data: { companyId: cid, name: "조직장", type: "DYNAMIC_ORG_HEAD", isSystem: true, description: "조직장 직책 자동 매핑" }, select: { id: true } }),
    prisma.role.create({ data: { companyId: cid, name: "기본", type: "DEFAULT", isSystem: true, description: "구성원 기본 역할" }, select: { id: true } }),
  ]);

  // 전체 권한 → 최고 관리자
  const allPerms = await prisma.permission.findMany({ select: { id: true, key: true, hasScope: true } });
  if (allPerms.length > 0) {
    await prisma.rolePermission.createMany({
      data: allPerms.map((p) => ({
        roleId: superAdminRole.id,
        permissionId: p.id,
        enabled: true,
        scopeType: p.hasScope ? "ALL" : null,
      })),
      skipDuplicates: true,
    });

    // 조직장 — 부서 스코프
    const orgHeadPerms = allPerms.filter((p) => ORG_HEAD_ROLE_KEYS.includes(p.key));
    await prisma.rolePermission.createMany({
      data: orgHeadPerms.map((p) => ({ roleId: orgHeadRole.id, permissionId: p.id, enabled: true, scopeType: "DEPARTMENT" })),
      skipDuplicates: true,
    });

    // DEFAULT — 기본 조회 (전사 스코프)
    const defaultPerms = allPerms.filter((p) => DEFAULT_ROLE_KEYS.includes(p.key));
    await prisma.rolePermission.createMany({
      data: defaultPerms.map((p) => ({ roleId: defaultRole.id, permissionId: p.id, enabled: true, scopeType: p.hasScope ? "ALL" : null })),
      skipDuplicates: true,
    });
  }

  // 역할 부여
  //   admin → SYSTEM_SUPER_ADMIN + DYNAMIC_ORG_HEAD (개발팀 팀장)
  //   hr    → DEFAULT
  //   emp   → DEFAULT
  await prisma.userRole.createMany({
    data: [
      { employeeId: adminEmp.id, roleId: superAdminRole.id },
      { employeeId: adminEmp.id, roleId: orgHeadRole.id },
      { employeeId: hrEmp.id, roleId: defaultRole.id },
      { employeeId: empEmp.id, roleId: defaultRole.id },
    ],
    skipDuplicates: true,
  });

  // ── 9. 휴가 종류 (연차) ───────────────────────────────────────────
  const annualLeave = await prisma.leaveType.create({
    data: {
      companyId: cid,
      key: LEAVE_KEY,
      name: "연차",
      grantMethod: "PERIODIC",
      grantUnit: "DAY",
      grantAmount: 15,
      paymentType: "PAID",
      isActive: true,
    },
    select: { id: true, name: true },
  });

  // ── 10. 휴가 잔여 및 이력 ─────────────────────────────────────────
  const year = new Date().getFullYear();
  const grantReason = `${year}년 정기 부여`;

  // admin: 15일 부여, 0 사용
  // hr:    15일 부여, 1일 사용 (과거 승인된 휴가 반영)
  // emp:   15일 부여, 0 사용 (PENDING 신청은 미차감)
  await prisma.$transaction([
    prisma.leaveBalance.create({ data: { employeeId: adminEmp.id, leaveTypeId: annualLeave.id, year, grantedDays: 15, usedDays: 0 } }),
    prisma.leaveTransaction.create({ data: { employeeId: adminEmp.id, leaveTypeId: annualLeave.id, category: "ANNUAL", txType: "GRANT", days: 15, reason: grantReason } }),
    prisma.leaveBalance.create({ data: { employeeId: hrEmp.id, leaveTypeId: annualLeave.id, year, grantedDays: 15, usedDays: 1 } }),
    prisma.leaveTransaction.create({ data: { employeeId: hrEmp.id, leaveTypeId: annualLeave.id, category: "ANNUAL", txType: "GRANT", days: 15, reason: grantReason } }),
    prisma.leaveBalance.create({ data: { employeeId: empEmp.id, leaveTypeId: annualLeave.id, year, grantedDays: 15, usedDays: 0 } }),
    prisma.leaveTransaction.create({ data: { employeeId: empEmp.id, leaveTypeId: annualLeave.id, category: "ANNUAL", txType: "GRANT", days: 15, reason: grantReason } }),
  ]);

  // ── 11. hr 과거 승인 휴가 (S3 시나리오: 잔여 14일 검증) ──────────────
  // 3개월 전 1일 연차, admin이 승인 → usedDays=1 이미 반영
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
    await tx.approvalLine.create({
      data: {
        documentId: hrDoc.id,
        step: 1,
        approverId: adminEmp.id,
        status: "APPROVED",
        approvedAt,
      },
    });
    await tx.leaveRequest.create({
      data: {
        employeeId: hrEmp.id,
        leaveTypeId: annualLeave.id,
        startDate: pastDate,
        endDate: pastDate,
        days: 1,
        reason: "개인 용무",
        status: "APPROVED",
        reviewedAt: approvedAt,
        reviewedBy: adminEmp.id,
        formDocumentId: hrDoc.id,
      },
    });
    // 사용 트랜잭션 원장
    await tx.leaveTransaction.create({
      data: { employeeId: hrEmp.id, leaveTypeId: annualLeave.id, category: "ANNUAL", txType: "USE", days: 1, reason: "연차 사용 (2024-03-15)" },
    });
  });

  // ── 12. emp PENDING 휴가 신청 (S2 시나리오: admin 결재 대기) ──────────
  const leaveDay = new Date();
  leaveDay.setDate(leaveDay.getDate() + 7);
  leaveDay.setHours(0, 0, 0, 0);
  const leaveDayStr = leaveDay.toISOString().slice(0, 10);

  await prisma.$transaction(async (tx) => {
    const empDoc = await tx.formDocument.create({
      data: {
        companyId: cid,
        authorId: empEmp.id,
        title: `휴가 신청 — 연차 ${leaveDayStr}~${leaveDayStr} (1일)`,
        kind: "LEAVE_REQUEST",
        formData: { leaveTypeId: annualLeave.id, leaveTypeName: annualLeave.name, startDate: leaveDayStr, endDate: leaveDayStr, days: 1, reason: "개인 사정" },
        status: "IN_PROGRESS",
      },
      select: { id: true },
    });
    await tx.approvalLine.create({ data: { documentId: empDoc.id, step: 1, approverId: adminEmp.id, status: "PENDING" } });
    await tx.leaveRequest.create({
      data: {
        employeeId: empEmp.id,
        leaveTypeId: annualLeave.id,
        startDate: leaveDay,
        endDate: leaveDay,
        days: 1,
        reason: "개인 사정",
        status: "PENDING",
        formDocumentId: empDoc.id,
      },
    });
  });

  console.log(`  ✔ 데모 회사 생성: ${cid}`);
  console.log("  ✔ 계정: admin@teamlet.test · hr@teamlet.test · emp@teamlet.test (Test1234!)");
  console.log("  ✔ 역할: admin=최고관리자+조직장 / hr,emp=기본(DEFAULT)");
  console.log("  ✔ 연차: admin 15일 · hr 14일(1일 사용) · emp 15일(1일 결재대기)");
  console.log("  ✔ 결재 대기: emp→admin 연차 1건 (S2 시나리오)");
  console.log("  ✔ 승인 이력: hr 연차 2024-03-15 승인 완료 (S3 시나리오)");
}
