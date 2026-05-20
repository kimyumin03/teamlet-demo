/**
 * 회사 신청 승인 — Company 생성 + 부트스트랩 + 신청자 SUPER_ADMIN UserRole 부여.
 *
 * 호출처:
 *   1) P1 데모 자가-승인: submitCompanyApplication 직후 (TEAMLET_DEMO_AUTO_APPROVE=true)
 *   2) P2+ 운영 admin 도구: PENDING 신청을 검토한 운영자가 호출
 *
 * 트랜잭션 경계:
 *   - prisma.$transaction(Company/Employee/Membership/Application.update) 1개
 *   - bootstrapCompanyRoles 는 자체 트랜잭션 — 분리되어도 idempotent 안전
 *   - UserRole.create 는 트랜잭션 밖 (bootstrap 직후, 작은 mutation)
 */

import { randomBytes } from "node:crypto";
import { prisma } from "@teamlet/db";
import { err, errors, ok, type Result } from "@teamlet/shared";
import { recordAudit } from "../audit/index";
import { bootstrapCompanyRoles } from "../permission/bootstrap";
import { bootstrapCompanyLeaveTypes } from "../leave/bootstrap";

export type ApprovalResult = {
  companyId: string;
  employeeId: string;
  superAdminRoleId: string;
};

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 혼동(0/O, 1/I) 제외

function generateCompanyCode(): string {
  const part = (n = 4) =>
    Array.from(randomBytes(n))
      .map((b) => CODE_CHARS[b % CODE_CHARS.length]!)
      .join("");
  return `${part()}-${part()}`;
}

export async function approveCompanyApplication(
  applicationId: string,
  ctx: {
    approverUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  } = {},
): Promise<Result<ApprovalResult>> {
  const app = await prisma.companyApplication.findUnique({
    where: { id: applicationId },
    include: { applicant: { select: { id: true, name: true } } },
  });
  if (!app) return err(errors.notFound("신청을 찾을 수 없어요"));
  if (app.status !== "PENDING") {
    return err(errors.conflict("이미 처리된 신청이에요"));
  }

  const businessNumber = app.businessNumber.replace(/\D/g, "");

  const dupBn = await prisma.company.findUnique({
    where: { businessNumber },
    select: { id: true },
  });
  if (dupBn) return err(errors.conflict("이미 등록된 사업자번호예요"));

  // 트랜잭션: Company + Employee + Membership + Application 갱신
  const txResult = await prisma.$transaction(async (tx) => {
    // companyCode 충돌 회피 — 최대 5회 재시도
    let companyCode = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      companyCode = generateCompanyCode();
      const dup = await tx.company.findUnique({
        where: { companyCode },
        select: { id: true },
      });
      if (!dup) break;
      if (attempt === 4) {
        throw errors.internal("회사코드 생성에 실패했어요");
      }
    }

    const company = await tx.company.create({
      data: {
        name: app.companyName,
        businessNumber,
        companyCode,
        joinPolicy: "REQUIRE_APPROVAL",
      },
    });

    const employee = await tx.employee.create({
      data: {
        companyId: company.id,
        name: app.applicant.name,
        employmentStatus: "ACTIVE",
      },
    });

    await tx.userCompanyMembership.create({
      data: {
        userId: app.applicantUserId,
        companyId: company.id,
        employeeId: employee.id,
        status: "ACTIVE",
        joinPath: "APPLICATION",
        activatedAt: new Date(),
      },
    });

    await tx.companyApplication.update({
      where: { id: applicationId },
      data: {
        status: "APPROVED",
        reviewerUserId: ctx.approverUserId ?? null,
        reviewedAt: new Date(),
        createdCompanyId: company.id,
      },
    });

    return { company, employee };
  });

  // 트랜잭션 밖: 시스템 역할 + 전권한 매핑 + 법정 휴가 종류 (모두 idempotent)
  const [bootstrap] = await Promise.all([
    bootstrapCompanyRoles(txResult.company.id),
    bootstrapCompanyLeaveTypes(txResult.company.id),
  ]);

  // SUPER_ADMIN 부여
  await prisma.userRole.create({
    data: {
      employeeId: txResult.employee.id,
      roleId: bootstrap.superAdminRoleId,
      assignedByUserId: ctx.approverUserId ?? null,
      isActive: true,
    },
  });

  await recordAudit({
    companyId: txResult.company.id,
    actorUserId: ctx.approverUserId ?? null,
    activityType: "tenancy",
    eventType: "UPDATE",
    targetType: "CompanyApplication",
    targetId: applicationId,
    targetLabel: app.companyName,
    description: `회사 신청 승인: ${app.companyName} (시스템 역할 + 최고 관리자 부여)`,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return ok({
    companyId: txResult.company.id,
    employeeId: txResult.employee.id,
    superAdminRoleId: bootstrap.superAdminRoleId,
  });
}
