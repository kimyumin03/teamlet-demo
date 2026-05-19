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
import { recordAudit } from "../audit/index";

/** 로그인 후 라우팅 판단용 — 사용자의 회사 멤버십 요약 */
export async function getMembershipSummary(userId: string): Promise<{
  active: { companyId: string; employeeId: string | null }[];
  pending: number;
}> {
  const memberships = await prisma.userCompanyMembership.findMany({
    where: { userId },
    select: { companyId: true, employeeId: true, status: true },
  });
  return {
    active: memberships
      .filter((m) => m.status === "ACTIVE")
      .map((m) => ({ companyId: m.companyId, employeeId: m.employeeId })),
    pending: memberships.filter((m) => m.status === "PENDING").length,
  };
}

/** 회사 등록 신청 — Sales-led (docs/06 §1.2 register-company) */
export async function submitCompanyApplication(
  userId: string,
  raw: CompanyApplicationInput,
  ctx: { ip?: string | null; userAgent?: string | null } = {},
): Promise<Result<{ applicationId: string }>> {
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

  return ok({ joinRequestId: result.id, companyName: company.name });
}
