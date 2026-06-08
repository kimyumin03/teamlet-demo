/**
 * 목업(DEMO-0000) 회사만 선택 삭제 후 재시드 — 일회성 유틸.
 * ⚠️ DEMO-0001(teamlet 데모 주식회사)·실제 회사 데이터는 건드리지 않는다.
 * 실행: pnpm --filter @teamlet/db exec tsx seed/reseed-mockup.ts
 *
 * 일부 FK(ApprovalLine.approverId 등)가 RESTRICT 라 Company cascade 삭제가 막힌다.
 * → cid 범위의 자식 레코드를 FK 컬럼 직접 참조로 의존 역순 삭제 후 회사를 지운다.
 */
import { prisma } from "../src/index";
import { seedDemoMockup } from "./demo-mockup";

const MOCKUP_CODE = "DEMO-0000";

async function purgeCompany(cid: string): Promise<void> {
  const [emps, docs, roles] = await Promise.all([
    prisma.employee.findMany({ where: { companyId: cid }, select: { id: true } }),
    prisma.formDocument.findMany({ where: { companyId: cid }, select: { id: true } }),
    prisma.role.findMany({ where: { companyId: cid }, select: { id: true } }),
  ]);
  const empIds = emps.map((e) => e.id);
  const docIds = docs.map((d) => d.id);
  const roleIds = roles.map((r) => r.id);

  // 의존 역순 — 자식(직원/문서/역할 참조)부터 비우고 마지막에 회사
  await prisma.$transaction([
    prisma.approvalLine.deleteMany({ where: { documentId: { in: docIds } } }),
    prisma.leaveRequest.deleteMany({ where: { employeeId: { in: empIds } } }),
    prisma.leaveTransaction.deleteMany({ where: { employeeId: { in: empIds } } }),
    prisma.leaveBalance.deleteMany({ where: { employeeId: { in: empIds } } }),
    prisma.leavePolicyAssignment.deleteMany({ where: { employeeId: { in: empIds } } }),
    prisma.leavePolicy.deleteMany({ where: { companyId: cid } }),
    prisma.formDocument.deleteMany({ where: { companyId: cid } }),
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

async function main() {
  const existing = await prisma.company.findUnique({
    where: { companyCode: MOCKUP_CODE },
    select: { id: true },
  });

  if (existing) {
    await purgeCompany(existing.id);
    console.log(`🗑  ${MOCKUP_CODE}(목업) 삭제 — DEMO-0001 은 보존됨`);
  } else {
    console.log(`ℹ  기존 ${MOCKUP_CODE} 없음 — 신규 생성`);
  }

  await seedDemoMockup(prisma);
  console.log(`✅ ${MOCKUP_CODE} 재시드 완료`);
}

main()
  .catch((e) => {
    console.error("❌ 재시드 실패", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
