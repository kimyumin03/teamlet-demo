/**
 * 멀티 테넌시 (docs/03 §13). User ↔ Company 다대다.
 * Phase 1: 가입 흐름 3종 (회사등록신청 / 회사코드 가입 / 초대) + 멤버십 조회.
 */
import { prisma } from "@teamlet/db";
import {
  companyApplicationSchema,
  joinByCodeSchema,
  type CompanyApplicationInput,
  type JoinByCodeInput,
  type Result,
  ok,
  err,
  errors,
} from "@teamlet/shared";
import { createNotification } from "../notification/notification";
import { recordAudit } from "../audit/index";
import { approveCompanyApplication } from "./approval";

export { approveCompanyApplication, rejectCompanyApplication } from "./approval";
export { listPendingMemberships, approveMembership, rejectMembership } from "./membership";
export type { PendingMemberItem } from "./membership";
export type { ApprovalResult } from "./approval";
export { getCompanyInfo, updateCompanyInfo } from "./company";
export type { CompanyInfo, CompanyUpdateInput } from "./company";
export { listCompanyHolidays, addCompanyHoliday, deleteCompanyHoliday } from "./holiday";
export type { HolidayItem } from "./holiday";
export {
  listCompanyApplications,
  listAllCompanies,
  listAllUsers,
  getPlatformStats,
} from "./platform";
export type { CompanyApplicationItem, CompanyAdminItem, PlatformUserItem } from "./platform";

/** 로그인 후 라우팅 판단용 — 사용자의 회사 멤버십 요약.
 *  pending: UserCompanyMembership(PENDING) + CompanyApplication(PENDING) 합산
 *  rejected: 가장 최근 반려된 CompanyApplication (사유 포함) */
export async function getMembershipSummary(userId: string): Promise<{
  active: { companyId: string; employeeId: string | null }[];
  pending: number;
  rejected: { companyName: string; reviewMemo: string | null } | null;
}> {
  const [memberships, pendingAppCount, rejectedApp] = await Promise.all([
    prisma.userCompanyMembership.findMany({
      where: { userId },
      select: { companyId: true, employeeId: true, status: true, company: { select: { name: true } } },
    }),
    prisma.companyApplication.count({
      where: { applicantUserId: userId, status: "PENDING" },
    }),
    prisma.companyApplication.findFirst({
      where: { applicantUserId: userId, status: "REJECTED" },
      select: { companyName: true, reviewMemo: true },
      orderBy: { reviewedAt: "desc" },
    }),
  ]);

  const rejectedMembership = memberships.find((m) => m.status === "REJECTED");

  return {
    active: memberships
      .filter((m) => m.status === "ACTIVE")
      .map((m) => ({ companyId: m.companyId, employeeId: m.employeeId })),
    pending: memberships.filter((m) => m.status === "PENDING").length + pendingAppCount,
    rejected: rejectedApp
      ?? (rejectedMembership ? { companyName: rejectedMembership.company.name, reviewMemo: null } : null),
  };
}

/**
 * 로그인 직후 활성 회사 컨텍스트 1개 선택 (P1: 첫 ACTIVE membership).
 * P2 이후 회사 스위처 UI 도입 시 cookie / URL 우선 적용으로 확장 예정.
 * 가입 대기 중 (PENDING) 또는 employeeId 미할당 사용자는 null 반환.
 */
export async function resolveLoginContext(
  userId: string,
): Promise<{ companyId: string; employeeId: string } | null> {
  const summary = await getMembershipSummary(userId);
  const active = summary.active.find((m) => m.employeeId !== null);
  if (!active || !active.employeeId) return null;
  return { companyId: active.companyId, employeeId: active.employeeId };
}

/**
 * 회사 등록 신청 — Sales-led (docs/06 §1.2 register-company).
 *
 * `TEAMLET_DEMO_AUTO_APPROVE === "true"` 이면 신청 직후 자동 승인 (P1 데모 흐름).
 * 자동 승인이 성공하면 결과에 `autoApproved: true` + `companyId` 가 채워짐. 호출자는
 * 이를 보고 `/home` 으로 보낼지 `/pending-approval` 로 보낼지 결정. 자동 승인 실패는
 * 신청 자체는 PENDING 으로 살아 있으므로 사용자에겐 신청 성공으로만 알림.
 */
export async function submitCompanyApplication(
  userId: string,
  raw: CompanyApplicationInput,
  ctx: { ip?: string | null; userAgent?: string | null } = {},
): Promise<
  Result<{
    applicationId: string;
    autoApproved?: boolean;
    companyId?: string;
  }>
> {
  const parsed = companyApplicationSchema.safeParse(raw);
  if (!parsed.success) {
    return err(errors.validation(parsed.error.issues[0]?.message ?? "입력 오류"));
  }
  const d = parsed.data;
  const businessNumber = d.businessNumber.replace(/\D/g, "");

  const dup = await prisma.companyApplication.findFirst({
    where: {
      applicantUserId: userId,
      status: "PENDING",
    },
  });
  if (dup) {
    return err(errors.conflict("이미 검토 대기 중인 신청이 있어요"));
  }

  const app = await prisma.companyApplication.create({
    data: {
      applicantUserId: userId,
      companyName: d.companyName,
      businessNumber,
      representativeName: d.representativeName,
      contact: d.contact,
      companySize: d.companySize,
      industry: d.industry,
      memo: d.memo ?? null,
      documentUrl: d.documentUrl ?? null,
    },
  });

  await recordAudit({
    actorUserId: userId,
    activityType: "tenancy",
    eventType: "CREATE",
    targetType: "CompanyApplication",
    targetId: app.id,
    targetLabel: d.companyName,
    description: `회사 등록 신청: ${d.companyName}`,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  if (process.env.TEAMLET_DEMO_AUTO_APPROVE === "true") {
    const approval = await approveCompanyApplication(app.id, {
      approverUserId: userId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    if (approval.ok) {
      return ok({
        applicationId: app.id,
        autoApproved: true,
        companyId: approval.data.companyId,
      });
    }
    // 자동 승인 실패: 신청은 PENDING 상태로 남음. 사용자에겐 일반 신청 완료로 응답.
  }

  return ok({ applicationId: app.id });
}

/** 회사코드로 가입 신청 (docs/06 §1.2 join-company 옵션 2) */
export async function submitJoinByCode(
  userId: string,
  raw: JoinByCodeInput,
  ctx: { ip?: string | null; userAgent?: string | null } = {},
): Promise<Result<{ joinRequestId: string; companyName: string }>> {
  const parsed = joinByCodeSchema.safeParse(raw);
  if (!parsed.success) {
    return err(errors.validation(parsed.error.issues[0]?.message ?? "입력 오류"));
  }
  const code = parsed.data.companyCode;

  const company = await prisma.company.findUnique({
    where: { companyCode: code },
  });
  if (!company || !company.companyCodeActive || !company.isActive) {
    return err(errors.notFound("유효하지 않은 회사코드예요"));
  }

  const existing = await prisma.userCompanyMembership.findUnique({
    where: { userId_companyId: { userId, companyId: company.id } },
  });
  if (existing) {
    return err(errors.conflict("이미 가입했거나 신청 중인 회사예요"));
  }

  const result = await prisma.$transaction(async (tx) => {
    const jr = await tx.joinRequest.create({
      data: {
        userId,
        companyId: company.id,
        usedCompanyCode: code,
        payload: parsed.data.memo ? { memo: parsed.data.memo } : undefined,
      },
    });
    await tx.userCompanyMembership.create({
      data: {
        userId,
        companyId: company.id,
        status: "PENDING",
        joinPath: "COMPANY_CODE",
      },
    });
    return jr;
  });

  await recordAudit({
    companyId: company.id,
    actorUserId: userId,
    activityType: "tenancy",
    eventType: "CREATE",
    targetType: "JoinRequest",
    targetId: result.id,
    targetLabel: company.name,
    description: `회사코드 가입 신청: ${company.name}`,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  // 회사 관리자에게 알림 전송 (실패해도 가입 신청 자체는 성공)
  try {
    const adminRoles = await prisma.userRole.findMany({
      where: {
        employee: { companyId: company.id, status: "ACTIVE" },
        role: { name: "ADMIN" },
      },
      select: { employeeId: true },
    });
    await Promise.all(
      adminRoles.map((ar) =>
        createNotification({
          companyId: company.id,
          recipientEmployeeId: ar.employeeId,
          category: "SYSTEM_SECURITY",
          eventKey: "system.member.join",
          title: "새 구성원 가입 신청",
          body: "새 구성원이 회사 가입을 신청했어요.",
          deepLink: "/members",
        }),
      ),
    );
  } catch { /* 알림 실패는 가입 신청 결과에 영향 없음 */ }

  return ok({ joinRequestId: result.id, companyName: company.name });
}
