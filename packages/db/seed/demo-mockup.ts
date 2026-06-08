/**
 * 목업 시연 시드 — DEMO-0000 회사 (데모 전용).
 * 개발 테스트용 DEMO-0001(demo.ts)과 별도로 관리.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ 체험 계정                                                     │
 * │   demo@teamlet.io  →  한지민 / 경영지원팀 팀장 (최고 관리자)  │
 * │                       비밀번호: Demo1234!                     │
 * │                                                              │
 * │ 온보딩 체험 — DB 는 구성원·조직·권한만(깨끗한 신규 회사).     │
 * │   • 구성원 15명 / 부서 5개 / 직책 5개 / 최고관리자 권한        │
 * │   • 휴가종류·정책·공휴일·연차부여·신청·결재 = 체험자가 직접   │
 * │     버튼으로 설정/축적. 로그아웃 시 원상복구(별도 동적 처리). │
 * └──────────────────────────────────────────────────────────────┘
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

const DEMO_EMAIL = "demo@teamlet.io";
const DEMO_PW = "Demo1234!";
const COMPANY_CODE = "DEMO-0000";
const BUSINESS_NUMBER = "111-11-11111";

export async function seedDemoMockup(prisma: PrismaClient): Promise<void> {
  const exists = await prisma.company.findUnique({ where: { companyCode: COMPANY_CODE } });
  if (exists) {
    // 목업은 온보딩 체험용(구성원·조직·권한만) — 추가 시드/보강 없음. 초기화는 reseed-mockup.
    console.log("  ℹ 목업(DEMO-0000) 이미 존재 — 온보딩 체험용이라 추가 시드 없음");
    return;
  }

  const adminPw = await hashPw(DEMO_PW);

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
    prisma.role.create({ data: { companyId: cid, name: "최고 관리자", type: "SYSTEM_SUPER_ADMIN", isSystem: true, description: "전체 권한 보유" }, select: { id: true } }),
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

  // ⚠️ 목업은 온보딩 체험용 — 휴가종류·정책·공휴일·연차부여·신청·결재는 DB에 시드하지 않는다.
  //   체험자가 직접 버튼으로 설정/부여한다("법정의무휴가 추가"·"기본 정책 만들기"·
  //   "법정공휴일 자동등록"·"연차 자동부여"·휴가 신청). 로그아웃 시 원상복구(별도 동적 처리).

  console.log(`  ✔ 목업 회사 생성 (DEMO-0000): ${cid}`);
  console.log(`  ✔ 체험 계정: ${DEMO_EMAIL} / ${DEMO_PW} → 한지민 (경영지원팀 팀장, 최고 관리자)`);
  console.log("  ✔ 구성원 15명 / 부서 5개 / 직책 5개 / 권한 — 휴가·정책·공휴일은 온보딩 체험으로 직접 설정");
}
