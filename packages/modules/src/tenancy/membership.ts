import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { getEffectivePermissions } from "../permission";

export interface PendingMemberItem {
  membershipId: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestedAt: Date;
}

/** 회사 관리자용 — PENDING 상태 가입 신청 목록 */
export async function listPendingMemberships(
  actorEmployeeId: string,
): Promise<Result<PendingMemberItem[]>> {
  const perms = await getEffectivePermissions(actorEmployeeId);
  if (!perms.has("member.directory.manage")) {
    return err(errors.forbidden("member.directory.manage 권한이 필요해요"));
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("구성원을 찾을 수 없어요"));

  const memberships = await prisma.userCompanyMembership.findMany({
    where: { companyId: emp.companyId, status: "PENDING" },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { appliedAt: "asc" },
  });

  return ok(
    memberships.map((m) => ({
      membershipId: m.id,
      userId: m.user.id,
      userName: m.user.name,
      userEmail: m.user.email,
      requestedAt: m.appliedAt,
    })),
  );
}

/** 가입 신청 승인 — PENDING → ACTIVE, Employee 레코드 생성 */
export async function approveMembership(
  actorEmployeeId: string,
  membershipId: string,
): Promise<Result<{ employeeId: string }>> {
  const perms = await getEffectivePermissions(actorEmployeeId);
  if (!perms.has("member.directory.manage")) {
    return err(errors.forbidden("member.directory.manage 권한이 필요해요"));
  }

  const membership = await prisma.userCompanyMembership.findUnique({
    where: { id: membershipId },
    include: { user: { select: { name: true } } },
  });
  if (!membership) return err(errors.notFound("신청을 찾을 수 없어요"));
  if (membership.status !== "PENDING") return err(errors.conflict("이미 처리된 신청이에요"));

  const actorEmp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!actorEmp || actorEmp.companyId !== membership.companyId) {
    return err(errors.forbidden("같은 회사 신청만 처리할 수 있어요"));
  }

  const defaultRole = await prisma.role.findFirst({
    where: { companyId: membership.companyId, type: "DEFAULT" },
    select: { id: true },
  });

  const result = await prisma.$transaction(async (tx) => {
    const employee = await tx.employee.create({
      data: {
        companyId: membership.companyId,
        name: membership.user.name,
        hireDate: new Date(),
        employmentStatus: "ACTIVE",
      },
    });

    await tx.userCompanyMembership.update({
      where: { id: membershipId },
      data: { status: "ACTIVE", employeeId: employee.id },
    });

    if (defaultRole) {
      await tx.userRole.createMany({
        data: [{ employeeId: employee.id, roleId: defaultRole.id }],
        skipDuplicates: true,
      });
    }

    return employee;
  });

  return ok({ employeeId: result.id });
}

/** 가입 신청 반려 — PENDING → REJECTED */
export async function rejectMembership(
  actorEmployeeId: string,
  membershipId: string,
): Promise<Result<void>> {
  const perms = await getEffectivePermissions(actorEmployeeId);
  if (!perms.has("member.directory.manage")) {
    return err(errors.forbidden("member.directory.manage 권한이 필요해요"));
  }

  const membership = await prisma.userCompanyMembership.findUnique({
    where: { id: membershipId },
    select: { id: true, status: true, companyId: true },
  });
  if (!membership) return err(errors.notFound("신청을 찾을 수 없어요"));
  if (membership.status !== "PENDING") return err(errors.conflict("이미 처리된 신청이에요"));

  const actorEmp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!actorEmp || actorEmp.companyId !== membership.companyId) {
    return err(errors.forbidden("같은 회사 신청만 처리할 수 있어요"));
  }

  await prisma.userCompanyMembership.update({
    where: { id: membershipId },
    data: { status: "REJECTED" },
  });

  return ok(undefined);
}
