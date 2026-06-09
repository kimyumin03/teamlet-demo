/**
 * 목업(DEMO-0000) 전체 초기화 — 로그아웃 시 자동 호출.
 * 체험 중 쌓인 데이터를 전부 삭제하고 구성원·조직·권한만 남긴 초기 상태로 복원.
 * ⚠️ DEMO-0001(개발 테스트 회사)은 절대 건드리지 않는다.
 */
import { prisma } from "@teamlet/db";
import { scrypt as _scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(_scrypt);

const DEMO_EMAIL = "demo@teamlet.io";
const DEMO_PW = "Demo1234!";
const COMPANY_CODE = "DEMO-0000";
const BUSINESS_NUMBER = "111-11-11111";

async function hashPw(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(plain, salt, 64)) as Buffer;
  return `scrypt$16384$${salt.toString("hex")}$${derived.toString("hex")}`;
}

async function purgeCompany(cid: string): Promise<void> {
  const [emps, docs, roles] = await Promise.all([
    prisma.employee.findMany({ where: { companyId: cid }, select: { id: true } }),
    prisma.formDocument.findMany({ where: { companyId: cid }, select: { id: true } }),
    prisma.role.findMany({ where: { companyId: cid }, select: { id: true } }),
  ]);
  const empIds = emps.map((e) => e.id);
  const docIds = docs.map((d) => d.id);
  const roleIds = roles.map((r) => r.id);

  // FK 의존 역순 삭제. 자식→부모 순서 필수.
  await prisma.$transaction([
    // 결재선 먼저 (ApprovalAction은 ApprovalLine onDelete:Cascade)
    prisma.approvalLine.deleteMany({ where: { documentId: { in: docIds } } }),
    // 문서 CC 참조자 (onDelete default=Restrict → FormDocument 전에 제거)
    prisma.documentCcRecipient.deleteMany({ where: { documentId: { in: docIds } } }),
    // 촉진 (LeavePromotionPlanDate는 onDelete:Cascade)
    prisma.leavePromotion.deleteMany({ where: { employeeId: { in: empIds } } }),
    // 휴가 데이터
    prisma.leaveRequest.deleteMany({ where: { employeeId: { in: empIds } } }),
    prisma.leaveTransaction.deleteMany({ where: { employeeId: { in: empIds } } }),
    prisma.leaveBalance.deleteMany({ where: { employeeId: { in: empIds } } }),
    prisma.leavePolicyAssignment.deleteMany({ where: { employeeId: { in: empIds } } }),
    prisma.leavePolicy.deleteMany({ where: { companyId: cid } }),
    // 결재 문서 (CC + Lines 이미 제거됨)
    prisma.formDocument.deleteMany({ where: { companyId: cid } }),
    // BulkOperation (actorId=Employee FK Restrict → Employee 전에 제거)
    prisma.bulkOperation.deleteMany({ where: { companyId: cid } }),
    // 나머지 회사 범위 데이터
    prisma.appointment.deleteMany({ where: { companyId: cid } }),
    prisma.userRole.deleteMany({ where: { employeeId: { in: empIds } } }),
    prisma.rolePermission.deleteMany({ where: { roleId: { in: roleIds } } }),
    prisma.recognition.deleteMany({ where: { companyId: cid } }),
    prisma.notification.deleteMany({ where: { companyId: cid } }),
    prisma.companyHoliday.deleteMany({ where: { companyId: cid } }),
    prisma.leaveType.deleteMany({ where: { companyId: cid } }),
    prisma.userCompanyMembership.deleteMany({ where: { companyId: cid } }),
    prisma.employee.deleteMany({ where: { companyId: cid } }),
    prisma.department.deleteMany({ where: { companyId: cid } }),
    prisma.position.deleteMany({ where: { companyId: cid } }),
    prisma.role.deleteMany({ where: { companyId: cid } }),
    prisma.company.delete({ where: { id: cid } }),
  ]);
}

async function seedMockupCompany(adminPwHash: string): Promise<void> {
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: { email: DEMO_EMAIL, name: "한지민", passwordHash: adminPwHash, emailVerified: true },
    update: {},
    select: { id: true },
  });

  const company = await prisma.company.create({
    data: {
      name: "아크로스 주식회사",
      businessNumber: BUSINESS_NUMBER,
      companyCode: COMPANY_CODE,
      joinPolicy: "REQUIRE_APPROVAL",
      isSetupCompleted: true,
    },
    select: { id: true },
  });
  const cid = company.id;

  const [devDept, designDept, mktDept, hrDept, finDept] = await Promise.all([
    prisma.department.create({ data: { companyId: cid, name: "개발팀" }, select: { id: true, name: true } }),
    prisma.department.create({ data: { companyId: cid, name: "디자인팀" }, select: { id: true, name: true } }),
    prisma.department.create({ data: { companyId: cid, name: "마케팅팀" }, select: { id: true, name: true } }),
    prisma.department.create({ data: { companyId: cid, name: "인사팀" }, select: { id: true, name: true } }),
    prisma.department.create({ data: { companyId: cid, name: "경영지원팀" }, select: { id: true, name: true } }),
  ]);

  const [ceoPos, leadPos, seniorPos, memberPos, internPos] = await Promise.all([
    prisma.position.create({ data: { companyId: cid, name: "대표이사" }, select: { id: true, name: true } }),
    prisma.position.create({ data: { companyId: cid, name: "팀장" }, select: { id: true, name: true } }),
    prisma.position.create({ data: { companyId: cid, name: "시니어" }, select: { id: true, name: true } }),
    prisma.position.create({ data: { companyId: cid, name: "팀원" }, select: { id: true, name: true } }),
    prisma.position.create({ data: { companyId: cid, name: "인턴" }, select: { id: true, name: true } }),
  ]);

  const roster: Array<{ name: string; hireDate: Date; deptId: string; posId: string }> = [
    { name: "강태준", hireDate: new Date("2019-05-01T00:00:00.000Z"), deptId: finDept.id,    posId: ceoPos.id    },
    { name: "최영수", hireDate: new Date("2020-09-01T00:00:00.000Z"), deptId: devDept.id,    posId: leadPos.id   },
    { name: "김민준", hireDate: new Date("2021-03-15T00:00:00.000Z"), deptId: devDept.id,    posId: seniorPos.id },
    { name: "이서연", hireDate: new Date("2022-07-01T00:00:00.000Z"), deptId: devDept.id,    posId: memberPos.id },
    { name: "박지훈", hireDate: new Date("2023-02-01T00:00:00.000Z"), deptId: devDept.id,    posId: memberPos.id },
    { name: "정다은", hireDate: new Date("2024-03-01T00:00:00.000Z"), deptId: devDept.id,    posId: internPos.id },
    { name: "서소영", hireDate: new Date("2021-06-01T00:00:00.000Z"), deptId: designDept.id, posId: leadPos.id   },
    { name: "강현우", hireDate: new Date("2022-11-01T00:00:00.000Z"), deptId: designDept.id, posId: memberPos.id },
    { name: "윤나은", hireDate: new Date("2021-01-04T00:00:00.000Z"), deptId: mktDept.id,    posId: leadPos.id   },
    { name: "조민서", hireDate: new Date("2023-08-01T00:00:00.000Z"), deptId: mktDept.id,    posId: memberPos.id },
    { name: "송유진", hireDate: new Date("2020-03-02T00:00:00.000Z"), deptId: hrDept.id,     posId: leadPos.id   },
    { name: "오채원", hireDate: new Date("2022-05-16T00:00:00.000Z"), deptId: hrDept.id,     posId: memberPos.id },
    { name: "한지민", hireDate: new Date("2020-07-01T00:00:00.000Z"), deptId: finDept.id,    posId: leadPos.id   }, // ← demo@teamlet.io
    { name: "임도현", hireDate: new Date("2023-04-03T00:00:00.000Z"), deptId: finDept.id,    posId: memberPos.id },
    { name: "권승우", hireDate: new Date("2021-10-01T00:00:00.000Z"), deptId: devDept.id,    posId: seniorPos.id },
  ];

  const createdEmps = await prisma.$transaction(
    roster.map((r) =>
      prisma.employee.create({
        data: {
          companyId: cid,
          name: r.name,
          hireDate: r.hireDate,
          departmentId: r.deptId,
          positionId: r.posId,
          employmentStatus: "ACTIVE",
        },
        select: { id: true, name: true },
      }),
    ),
  );

  const adminEmp = createdEmps[12]!; // 한지민 (index 12)

  await prisma.userCompanyMembership.create({
    data: {
      userId: demoUser.id,
      companyId: cid,
      employeeId: adminEmp.id,
      status: "ACTIVE",
      joinPath: "APPLICATION",
    },
  });

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

  const [superAdminRole, defaultRole] = await Promise.all([
    prisma.role.create({
      data: { companyId: cid, name: "최고 관리자", type: "SYSTEM_SUPER_ADMIN", isSystem: true, description: "전체 권한 보유" },
      select: { id: true },
    }),
    prisma.role.create({
      data: { companyId: cid, name: "기본", type: "DEFAULT", isSystem: true, description: "구성원 기본 역할" },
      select: { id: true },
    }),
  ]);

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
    const defaultKeys = ["member.directory.read", "leave.balance.read", "company.basic_info.read"];
    const defPerms = allPerms.filter((p) => defaultKeys.includes(p.key));
    await prisma.rolePermission.createMany({
      data: defPerms.map((p) => ({
        roleId: defaultRole.id,
        permissionId: p.id,
        enabled: true,
        scopeType: p.hasScope ? "ALL" : null,
      })),
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
}

/**
 * DEMO-0000 회사를 온보딩 초기 상태로 완전 복원.
 * 체험 중 설정한 휴가종류·정책·공휴일·연차·신청·결재를 전부 비우고
 * 구성원 15명·조직·권한만 남긴다.
 */
export async function resetDemoMockup(): Promise<void> {
  // 비밀번호 해시 계산은 DB 트랜잭션 밖에서 (CPU 비동기 작업)
  const adminPwHash = await hashPw(DEMO_PW);

  const existing = await prisma.company.findUnique({
    where: { companyCode: COMPANY_CODE },
    select: { id: true },
  });
  if (existing) {
    await purgeCompany(existing.id);
  }

  await seedMockupCompany(adminPwHash);
}
