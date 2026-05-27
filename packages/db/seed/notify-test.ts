import { PrismaClient } from "../generated/client/index.js";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.employee.findFirst({
    where: { name: "김관리" },
    select: { id: true, companyId: true },
  });

  if (!admin) {
    console.error("김관리 계정을 찾을 수 없어요. 시드를 먼저 실행해 주세요.");
    process.exit(1);
  }

  await prisma.notification.createMany({
    data: [
      {
        companyId: admin.companyId,
        recipientEmployeeId: admin.id,
        category: "APPROVAL",
        eventKey: "approval.requested",
        title: "휴가 결재 요청",
        body: "박사원님이 연차 1일 결재를 요청했어요.",
        deepLink: "/workflow?tab=inbox",
        isRead: false,
      },
      {
        companyId: admin.companyId,
        recipientEmployeeId: admin.id,
        category: "APPROVAL",
        eventKey: "approval.completed",
        title: "결재 완료",
        body: "이인사님의 휴가 신청이 승인 처리됐어요.",
        deepLink: "/workflow?tab=sent",
        isRead: false,
      },
      {
        companyId: admin.companyId,
        recipientEmployeeId: admin.id,
        category: "SYSTEM_SECURITY",
        eventKey: "system.member.join",
        title: "새 구성원 가입 신청",
        body: "새 구성원이 회사 가입을 신청했어요.",
        deepLink: "/members",
        isRead: false,
      },
      {
        companyId: admin.companyId,
        recipientEmployeeId: admin.id,
        category: "HR",
        eventKey: "hr.leave.grant",
        title: "연차 자동 부여 완료",
        body: "2026년 연차가 전 구성원에게 자동 부여됐어요.",
        deepLink: "/hr/leave",
        isRead: true,
      },
      {
        companyId: admin.companyId,
        recipientEmployeeId: admin.id,
        category: "APPROVAL",
        eventKey: "approval.rejected",
        title: "문서 반려됨",
        body: "박사원님의 정보변경 요청이 반려됐어요.",
        deepLink: "/workflow?tab=all",
        isRead: true,
      },
    ],
  });

  console.log("✔ 테스트 알림 5개 삽입 완료 (김관리)");
  console.log("  읽지 않음: 3개 / 읽음: 2개");
}

main().finally(() => prisma.$disconnect());
