/**
 * 직원 초대 — HR이 생성한 링크로 기존/신규 사용자가 직원 레코드에 연결되는 흐름.
 * EmployeeInvite 모델: prefilledData.employeeId 에 타깃 직원 id 저장.
 */
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { assertPermission } from "../permission";
import { loadActor, catchDomainErr } from "../permission/_actor";
import { recordAudit } from "../audit/index";

const DIRECTORY_MANAGE = "member.directory.manage";
const INVITE_TTL_DAYS = 7;

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export type InviteInfo = {
  id: string;
  companyId: string;
  companyName: string;
  inviterName: string;
  employeeId: string;
  employeeName: string;
  email: string;
  expiresAt: Date;
};

/** HR이 직원 초대 링크를 생성. 반환값 rawToken을 URL에 포함시켜 공유. */
export async function createEmployeeInvite(
  actorEmployeeId: string,
  targetEmployeeId: string,
): Promise<Result<{ rawToken: string; email: string }>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.unauthenticated("인증 오류"));

  try {
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const target = await prisma.employee.findUnique({
    where: { id: targetEmployeeId },
    select: {
      id: true,
      name: true,
      companyId: true,
      companyEmail: true,
      personalEmail: true,
      membership: { select: { userId: true, status: true } },
    },
  });

  if (!target || target.companyId !== actor.companyId) {
    return err(errors.notFound("직원을 찾을 수 없어요"));
  }

  // 이미 계정에 연결되어 있으면 초대 불필요
  if (target.membership?.status === "ACTIVE") {
    return err(errors.conflict("이미 계정에 연결된 직원이에요"));
  }

  const email = target.companyEmail ?? target.personalEmail ?? "";
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.employeeInvite.create({
    data: {
      companyId: actor.companyId,
      inviterUserId: actor.userId,
      email,
      tokenHash,
      expiresAt,
      prefilledData: { employeeId: targetEmployeeId },
    },
  });

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "hr",
    eventType: "CREATE",
    targetType: "EmployeeInvite",
    targetId: targetEmployeeId,
    targetLabel: target.name,
    description: `직원 초대 링크 생성: ${target.name}`,
  });

  return ok({ rawToken, email });
}

/** 초대 토큰 정보 조회 (수락 전 화면에서 사용). */
export async function getInviteInfo(rawToken: string): Promise<Result<InviteInfo>> {
  const tokenHash = hashToken(rawToken);
  const invite = await prisma.employeeInvite.findUnique({
    where: { tokenHash },
    include: {
      company: { select: { name: true } },
      inviter: { select: { name: true } },
    },
  });

  if (!invite) return err(errors.notFound("유효하지 않은 초대 링크예요"));
  if (invite.used) return err(errors.conflict("이미 사용된 초대 링크예요"));
  if (invite.expiresAt < new Date()) return err(errors.conflict("만료된 초대 링크예요"));

  const data = invite.prefilledData as Record<string, unknown> | null;
  const employeeId = data?.employeeId as string | undefined;
  if (!employeeId) return err(errors.internal("초대 데이터가 손상됐어요"));

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { name: true },
  });
  if (!employee) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  return ok({
    id: invite.id,
    companyId: invite.companyId,
    companyName: invite.company.name,
    inviterName: invite.inviter.name,
    employeeId,
    employeeName: employee.name,
    email: invite.email,
    expiresAt: invite.expiresAt,
  });
}

/** 로그인한 사용자가 초대를 수락 — UserCompanyMembership ACTIVE + 초대 소비. */
export async function acceptEmployeeInvite(
  userId: string,
  rawToken: string,
): Promise<Result<{ companyId: string; employeeId: string }>> {
  const tokenHash = hashToken(rawToken);
  const invite = await prisma.employeeInvite.findUnique({
    where: { tokenHash },
  });

  if (!invite) return err(errors.notFound("유효하지 않은 초대 링크예요"));
  if (invite.used) return err(errors.conflict("이미 사용된 초대 링크예요"));
  if (invite.expiresAt < new Date()) return err(errors.conflict("만료된 초대 링크예요"));

  const data = invite.prefilledData as Record<string, unknown> | null;
  const employeeId = data?.employeeId as string | undefined;
  if (!employeeId) return err(errors.internal("초대 데이터가 손상됐어요"));

  // 이미 다른 회사에 소속되어 있는지 확인
  const existingMembership = await prisma.userCompanyMembership.findFirst({
    where: { userId, status: "ACTIVE" },
  });
  if (existingMembership) {
    return err(errors.conflict("이미 다른 회사에 소속되어 있어요"));
  }

  // employeeId 가 이미 다른 사용자에 연결됐는지 확인
  const takenMembership = await prisma.userCompanyMembership.findFirst({
    where: { employeeId, status: "ACTIVE" },
  });
  if (takenMembership) {
    return err(errors.conflict("이미 다른 계정이 연결된 직원이에요"));
  }

  await prisma.$transaction(async (tx) => {
    // upsert: PENDING 멤버십이 있으면 ACTIVE로 갱신, 없으면 새로 생성
    await tx.userCompanyMembership.upsert({
      where: { userId_companyId: { userId, companyId: invite.companyId } },
      create: {
        userId,
        companyId: invite.companyId,
        employeeId,
        status: "ACTIVE",
        joinPath: "INVITE",
        activatedAt: new Date(),
      },
      update: {
        employeeId,
        status: "ACTIVE",
        joinPath: "INVITE",
        activatedAt: new Date(),
      },
    });

    await tx.employeeInvite.update({
      where: { id: invite.id },
      data: { used: true, usedAt: new Date() },
    });
  });

  await recordAudit({
    companyId: invite.companyId,
    actorUserId: userId,
    activityType: "tenancy",
    eventType: "CREATE",
    targetType: "UserCompanyMembership",
    targetId: employeeId,
    description: "초대 링크로 회사 가입",
  });

  return ok({ companyId: invite.companyId, employeeId });
}
