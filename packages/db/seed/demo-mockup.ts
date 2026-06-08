/**
 * 목업 시연 시드 — DEMO-0000 회사 (데모 전용).
 * 개발 테스트용 DEMO-0001(demo.ts)과 별도로 관리.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ 체험 계정                                                     │
 * │   demo@teamlet.io  →  한지민 / 경영지원팀 팀장 (최고 관리자)  │
 * │                       비밀번호: Demo1234!                     │
 * │                                                              │
 * │ 시연 포인트                                                   │
 * │   • 구성원 15명 / 부서 5개 / 직책 5개                         │
 * │   • 법정 휴가 20종 (bootstrapLeaveTypes)                      │
 * │   • 연차·병가·경조사 잔여·이력                                │
 * │   • 결재 대기·완료·반려 이력                                   │
 * └──────────────────────────────────────────────────────────────┘
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

const DEMO_EMAIL = "demo@teamlet.io";
const DEMO_PW = "Demo1234!";
const COMPANY_CODE = "DEMO-0000";
const BUSINESS_NUMBER = "111-11-11111";

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

export async function seedDemoMockup(prisma: PrismaClient): Promise<void> {
  const exists = await prisma.company.findUnique({ where: { companyCode: COMPANY_CODE } });
  if (exists) {
    // 멱등 보강 — DB 리셋 없이 `pnpm db:seed` 만으로 기존 데모 회사에 누락분을 채운다.
    const count = await bootstrapLeaveTypes(prisma, exists.id);

    // 기본 연차 정책 보강 (없을 때만)
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

    // 공휴일 보강 (올해·내년 — API 우선, 양력 fallback)
    const y = new Date().getFullYear();
    const holi = await seedCompanyHolidays(prisma, exists.id, [y, y + 1]);
    console.log(`  ✔ 법정 휴가 ${count}종 / 기본 정책·공휴일 ${holi.added}건(${holi.source}) 보강 (DEMO-0000)`);
    return;
  }

  const adminPw = await hashPw(DEMO_PW);
  const year = new Date().getFullYear();

  // ── 1. 체험 계정 (demo@teamlet.io) ────────────────────────────
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: { email: DEMO_EMAIL, name: "한지민", passwordHash: adminPw, emailVerified: true },
    update: {},
    select: { id: true },
  });

  // ── 2. 회사 ─────────────────────────────────────────────────────
  const company = await prisma.company.create({
    data: { name: "아크로스 주식회사", businessNumber: BUSINESS_NUMBER, companyCode: COMPANY_CODE, joinPolicy: "REQUIRE_APPROVAL", isSetupCompleted: true },
    select: { id: true },
  });
  const cid = company.id;

  // ── 3. 부서 (5개) ───────────────────────────────────────────────
  const [devDept, designDept, mktDept, hrDept, finDept] = await Promise.all([
    prisma.department.create({ data: { companyId: cid, name: "개발팀" }, select: { id: true, name: true } }),
    prisma.department.create({ data: { companyId: cid, name: "디자인팀" }, select: { id: true, name: true } }),
    prisma.department.create({ data: { companyId: cid, name: "마케팅팀" }, select: { id: true, name: true } }),
    prisma.department.create({ data: { companyId: cid, name: "인사팀" }, select: { id: true, name: true } }),
    prisma.department.create({ data: { companyId: cid, name: "경영지원팀" }, select: { id: true, name: true } }),
  ]);

  // ── 4. 직책 (5개) ───────────────────────────────────────────────
  const [ceoPos, leadPos, seniorPos, memberPos, internPos] = await Promise.all([
    prisma.position.create({ data: { companyId: cid, name: "대표이사" }, select: { id: true, name: true } }),
    prisma.position.create({ data: { companyId: cid, name: "팀장" }, select: { id: true, name: true } }),
    prisma.position.create({ data: { companyId: cid, name: "시니어" }, select: { id: true, name: true } }),
    prisma.position.create({ data: { companyId: cid, name: "팀원" }, select: { id: true, name: true } }),
    prisma.position.create({ data: { companyId: cid, name: "인턴" }, select: { id: true, name: true } }),
  ]);

  // ── 5. 직원 15명 (전원 여기서 생성 — 계정 연결은 6번에서) ────────
  // index 12 (한지민) = demo@teamlet.io 연결 대상 (최고 관리자)
  const roster: Array<{ name: string; hireDate: Date; deptId: string; posId: string }> = [
    { name: "강태준", hireDate: new Date("2019-05-01T00:00:00.000Z"), deptId: finDept.id,    posId: ceoPos.id    }, // 0  대표이사 (계정 없음)
    { name: "최영수", hireDate: new Date("2020-09-01T00:00:00.000Z"), deptId: devDept.id,    posId: leadPos.id   }, // 1
    { name: "김민준", hireDate: new Date("2021-03-15T00:00:00.000Z"), deptId: devDept.id,    posId: seniorPos.id }, // 2
    { name: "이서연", hireDate: new Date("2022-07-01T00:00:00.000Z"), deptId: devDept.id,    posId: memberPos.id }, // 3
    { name: "박지훈", hireDate: new Date("2023-02-01T00:00:00.000Z"), deptId: devDept.id,    posId: memberPos.id }, // 4
    { name: "정다은", hireDate: new Date("2024-03-01T00:00:00.000Z"), deptId: devDept.id,    posId: internPos.id }, // 5
    { name: "서소영", hireDate: new Date("2021-06-01T00:00:00.000Z"), deptId: designDept.id, posId: leadPos.id   }, // 6
    { name: "강현우", hireDate: new Date("2022-11-01T00:00:00.000Z"), deptId: designDept.id, posId: memberPos.id }, // 7
    { name: "윤나은", hireDate: new Date("2021-01-04T00:00:00.000Z"), deptId: mktDept.id,    posId: leadPos.id   }, // 8
    { name: "조민서", hireDate: new Date("2023-08-01T00:00:00.000Z"), deptId: mktDept.id,    posId: memberPos.id }, // 9
    { name: "송유진", hireDate: new Date("2020-03-02T00:00:00.000Z"), deptId: hrDept.id,     posId: leadPos.id   }, // 10
    { name: "오채원", hireDate: new Date("2022-05-16T00:00:00.000Z"), deptId: hrDept.id,     posId: memberPos.id }, // 11
    { name: "한지민", hireDate: new Date("2020-07-01T00:00:00.000Z"), deptId: finDept.id,    posId: leadPos.id   }, // 12 ← demo@teamlet.io
    { name: "임도현", hireDate: new Date("2023-04-03T00:00:00.000Z"), deptId: finDept.id,    posId: memberPos.id }, // 13
    { name: "권승우", hireDate: new Date("2021-10-01T00:00:00.000Z"), deptId: devDept.id,    posId: seniorPos.id }, // 14
  ];

  const createdEmps = await prisma.$transaction(
    roster.map((r) =>
      prisma.employee.create({
        data: { companyId: cid, name: r.name, hireDate: r.hireDate, departmentId: r.deptId, positionId: r.posId, employmentStatus: "ACTIVE" },
        select: { id: true, name: true },
      }),
    ),
  );

  // index 12 = 한지민 (최고 관리자 / demo@teamlet.io 연결)
  const adminEmp = createdEmps[12]!;

  // ── 6. 멤버십 (demo@teamlet.io → 한지민) ────────────────────────
  await prisma.userCompanyMembership.create({
    data: { userId: demoUser.id, companyId: cid, employeeId: adminEmp.id, status: "ACTIVE", joinPath: "APPLICATION" },
  });

  // ── 7. 발령 HIRE ─────────────────────────────────────────────────
  const deptNames = [finDept, devDept, devDept, devDept, devDept, devDept, designDept, designDept, mktDept, mktDept, hrDept, hrDept, finDept, finDept, devDept].map((d) => d.name);
  const posNames  = [ceoPos, leadPos, seniorPos, memberPos, memberPos, internPos, leadPos, memberPos, leadPos, memberPos, leadPos, memberPos, leadPos, memberPos, seniorPos].map((p) => p.name);

  await prisma.appointment.createMany({
    data: createdEmps.map((e, i) => ({
      companyId: cid,
      employeeId: e.id,
      kind: "HIRE",
      effectiveDate: roster[i]!.hireDate,
      toDepartmentId: roster[i]!.deptId,
      toDepartmentName: deptNames[i]!,
      toPositionId: roster[i]!.posId,
      toPositionName: posNames[i]!,
      appointedByName: "시스템",
    })),
  });

  // ── 8. 역할 (최고 관리자 / 기본) ────────────────────────────────
  const [superAdminRole, defaultRole] = await Promise.all([
    prisma.role.create({ data: { companyId: cid, name: "최고 관리자", type: "SYSTEM_SUPER_ADMIN", isSystem: true, description: "전사 권한 보유" }, select: { id: true } }),
    prisma.role.create({ data: { companyId: cid, name: "기본", type: "DEFAULT", isSystem: true, description: "구성원 기본 역할" }, select: { id: true } }),
  ]);

  const allPerms = await prisma.permission.findMany({ select: { id: true, key: true, hasScope: true } });
  if (allPerms.length > 0) {
    await prisma.rolePermission.createMany({
      data: allPerms.map((p) => ({ roleId: superAdminRole.id, permissionId: p.id, enabled: true, scopeType: p.hasScope ? "ALL" : null })),
      skipDuplicates: true,
    });
    const defaultKeys = ["member.directory.read", "leave.balance.read", "workflow.document.read", "company.basic_info.read"];
    const defPerms = allPerms.filter((p) => defaultKeys.includes(p.key));
    await prisma.rolePermission.createMany({
      data: defPerms.map((p) => ({ roleId: defaultRole.id, permissionId: p.id, enabled: true, scopeType: p.hasScope ? "ALL" : null })),
      skipDuplicates: true,
    });
  }

  await prisma.userRole.createMany({
    data: [
      { employeeId: adminEmp.id, roleId: superAdminRole.id },
      ...createdEmps.filter((e) => e.id !== adminEmp.id).map((e) => ({ employeeId: e.id, roleId: defaultRole.id })),
    ],
    skipDuplicates: true,
  });

  // ── 9. 휴가 종류 (연차·병가·경조사 — bootstrapLeaveTypes 와 별개로 시연용 3종) ──
  const [annualLeave, sickLeave, condolenceLeave] = await Promise.all([
    prisma.leaveType.upsert({ where: { companyId_key: { companyId: cid, key: "annual" } }, create: { companyId: cid, key: "annual", name: "연차", grantMethod: "PERIODIC", grantUnit: "DAY", grantAmount: 15, paymentType: "PAID", isActive: true, isRequired: true, isSystem: true }, update: { isRequired: true, isSystem: true }, select: { id: true, name: true } }),
    prisma.leaveType.upsert({ where: { companyId_key: { companyId: cid, key: "sick" } }, create: { companyId: cid, key: "sick", name: "병가", grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: 60, paymentType: "UNPAID", isActive: true }, update: {}, select: { id: true, name: true } }),
    prisma.leaveType.upsert({ where: { companyId_key: { companyId: cid, key: "condolence" } }, create: { companyId: cid, key: "condolence", name: "경조사 휴가", grantMethod: "ON_REQUEST", grantUnit: "DAY", grantAmount: 5, paymentType: "PAID", isActive: true }, update: {}, select: { id: true, name: true } }),
  ]);

  // ── 9.5. 기본 연차 정책 (teamlet 표준 — 부여 엔진이 미배정 구성원에 자동 적용) ──
  // 근로기준법 §60 호환: 회계연도·월개근·반차·올림. 승인선 = 한지민(최고 관리자).
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

  // ── 10. 연차 잔여 (전 직원 — 기본 정책 부여 엔진과 동일 규칙·멱등키) ──────
  // 부여량 = calcAnnualDays(근로기준법 §60). note = "{year}년 정기 부여" 로 부여 엔진 멱등키와 정합
  // → 데모 로그인 후 관리자가 "연차 자동부여"를 눌러도 중복 부여되지 않음.
  const usedDaysMap: Record<number, number> = { 0: 3, 1: 2, 2: 8, 3: 1, 4: 0, 5: 0, 6: 3, 7: 1, 8: 4, 9: 0, 10: 2, 11: 1, 12: 5, 13: 0, 14: 6 };

  await prisma.$transaction(
    createdEmps.flatMap((emp, i) => {
      const granted = calcAnnualDays(roster[i]!.hireDate, year);
      const used = usedDaysMap[i] ?? 0;
      return [
        prisma.leaveBalance.create({ data: { employeeId: emp.id, leaveTypeId: annualLeave.id, year, grantedDays: granted, usedDays: used } }),
        prisma.leaveTransaction.create({ data: { employeeId: emp.id, leaveTypeId: annualLeave.id, category: "ANNUAL", txType: "GRANT", days: granted, reason: "연차 자동부여", note: `${year}년 정기 부여` } }),
        ...(used > 0 ? [prisma.leaveTransaction.create({ data: { employeeId: emp.id, leaveTypeId: annualLeave.id, category: "ANNUAL", txType: "USE", days: used, reason: "연차 사용" } })] : []),
      ];
    }),
  );

  // ── 11. 결재 이력 (APPROVED / PENDING / REJECTED) ────────────────
  // 김민준 — 연차 3일 승인
  const emp2 = createdEmps[2]!;
  await prisma.$transaction(async (tx) => {
    const doc = await tx.formDocument.create({ data: { companyId: cid, authorId: emp2.id, title: "휴가 신청 — 연차 2024-08-12~2024-08-14 (3일)", kind: "LEAVE_REQUEST", formData: { leaveTypeId: annualLeave.id, startDate: "2024-08-12", endDate: "2024-08-14", days: 3, reason: "가족 여행" }, status: "APPROVED" }, select: { id: true } });
    await tx.approvalLine.create({ data: { documentId: doc.id, step: 1, approverId: adminEmp.id, status: "APPROVED", approvedAt: new Date("2024-08-05T10:00:00.000Z") } });
    await tx.leaveRequest.create({ data: { employeeId: emp2.id, leaveTypeId: annualLeave.id, startDate: new Date("2024-08-12T00:00:00.000Z"), endDate: new Date("2024-08-14T00:00:00.000Z"), days: 3, reason: "가족 여행", status: "APPROVED", reviewedAt: new Date("2024-08-05T10:00:00.000Z"), reviewedBy: adminEmp.id, formDocumentId: doc.id } });
  });

  // 이서연 — 연차 1일 PENDING (한지민 결재 대기 — 시연 핵심)
  const pendingDate = new Date();
  pendingDate.setDate(pendingDate.getDate() + 5);
  pendingDate.setHours(0, 0, 0, 0);
  const pendingDateStr = pendingDate.toISOString().slice(0, 10);
  const emp3 = createdEmps[3]!;
  await prisma.$transaction(async (tx) => {
    const doc = await tx.formDocument.create({ data: { companyId: cid, authorId: emp3.id, title: `휴가 신청 — 연차 ${pendingDateStr} (1일)`, kind: "LEAVE_REQUEST", formData: { leaveTypeId: annualLeave.id, startDate: pendingDateStr, endDate: pendingDateStr, days: 1, reason: "개인 사정" }, status: "IN_PROGRESS" }, select: { id: true } });
    await tx.approvalLine.create({ data: { documentId: doc.id, step: 1, approverId: adminEmp.id, status: "PENDING" } });
    await tx.leaveRequest.create({ data: { employeeId: emp3.id, leaveTypeId: annualLeave.id, startDate: pendingDate, endDate: pendingDate, days: 1, reason: "개인 사정", status: "PENDING", formDocumentId: doc.id } });
  });

  // 정다은 — 연차 반려
  const emp5 = createdEmps[5]!;
  await prisma.$transaction(async (tx) => {
    const doc = await tx.formDocument.create({ data: { companyId: cid, authorId: emp5.id, title: "휴가 신청 — 연차 2024-11-29 (1일)", kind: "LEAVE_REQUEST", formData: { leaveTypeId: annualLeave.id, startDate: "2024-11-29", endDate: "2024-11-29", days: 1, reason: "개인 용무" }, status: "REJECTED" }, select: { id: true } });
    await tx.approvalLine.create({ data: { documentId: doc.id, step: 1, approverId: adminEmp.id, status: "REJECTED", approvedAt: new Date("2024-11-25T09:00:00.000Z") } });
    await tx.leaveRequest.create({ data: { employeeId: emp5.id, leaveTypeId: annualLeave.id, startDate: new Date("2024-11-29T00:00:00.000Z"), endDate: new Date("2024-11-29T00:00:00.000Z"), days: 1, reason: "개인 용무", status: "REJECTED", reviewedAt: new Date("2024-11-25T09:00:00.000Z"), reviewedBy: adminEmp.id, formDocumentId: doc.id } });
  });

  // 서소영 — 병가 맞춤 부여 5일
  const emp6 = createdEmps[6]!;
  await prisma.$transaction([
    prisma.leaveBalance.create({ data: { employeeId: emp6.id, leaveTypeId: sickLeave.id, year, grantedDays: 5, usedDays: 0 } }),
    prisma.leaveTransaction.create({ data: { employeeId: emp6.id, leaveTypeId: sickLeave.id, category: "EXTRA_GRANT", txType: "GRANT", days: 5, reason: "병가 처방 (진단서 제출 확인)" } }),
  ]);

  // 송유진 — 경조사 부여 3일 (결혼)
  const emp10 = createdEmps[10]!;
  await prisma.$transaction([
    prisma.leaveBalance.create({ data: { employeeId: emp10.id, leaveTypeId: condolenceLeave.id, year, grantedDays: 3, usedDays: 0 } }),
    prisma.leaveTransaction.create({ data: { employeeId: emp10.id, leaveTypeId: condolenceLeave.id, category: "EXTRA_GRANT", txType: "GRANT", days: 3, reason: "경조사 — 본인 결혼" } }),
  ]);

  // ── 12. 법정 휴가 20종 upsert ────────────────────────────────────
  await bootstrapLeaveTypes(prisma, cid);

  // ── 13. 공휴일 (올해·내년 — 특일정보 API 우선, 양력 fallback) ──────
  const holi = await seedCompanyHolidays(prisma, cid, [year, year + 1]);

  console.log(`  ✔ 목업 회사 생성 (DEMO-0000): ${cid}`);
  console.log(`  ✔ 체험 계정: ${DEMO_EMAIL} / ${DEMO_PW} → 한지민 (경영지원팀 팀장, 최고 관리자)`);
  console.log(`  ✔ 구성원 15명 / 부서 5개 / 법정 필수 휴가 / 기본 연차 정책 / 공휴일 ${holi.added}건(${holi.source})`);
}
