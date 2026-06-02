import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { catchDomainErr } from "../permission/_actor";
import { assertPermission } from "../permission/assert";
import type { LeavePromotionItem } from "./types";

const BALANCE_MANAGE = "leave.balance.manage";

export async function listCompanyLeavePromotions(
  actorEmployeeId: string,
  year?: number,
): Promise<Result<LeavePromotionItem[]>> {
  try {
    await assertPermission(actorEmployeeId, BALANCE_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const targetYear = year ?? new Date().getFullYear();

  const promotions = await prisma.leavePromotion.findMany({
    where: {
      employee: { companyId: emp.companyId },
      year: targetYear,
    },
    include: {
      employee: {
        select: {
          name: true,
          employeeNumber: true,
          employmentStatus: true,
          department: { select: { name: true } },
        },
      },
      planDates: { select: { planDate: true }, orderBy: { planDate: "asc" } },
    },
    orderBy: [{ expiryDate: "asc" }, { employee: { name: "asc" } }],
  });

  return ok(
    promotions.map((p) => ({
      id: p.id,
      employeeId: p.employeeId,
      employeeName: p.employee.name,
      employeeNumber: p.employee.employeeNumber,
      departmentName: p.employee.department?.name ?? null,
      employmentStatus: p.employee.employmentStatus,
      year: p.year,
      promotionType: p.promotionType,
      targetDays: Number(p.targetDays),
      expiryDate: p.expiryDate,
      status: p.status,
      requestedAt: p.requestedAt,
      submittedAt: p.submittedAt,
      approvedAt: p.approvedAt,
      planDates: p.planDates.map((d) => d.planDate),
      formDocumentId: p.formDocumentId,
    })),
  );
}

export async function cancelLeavePromotion(
  actorEmployeeId: string,
  promotionId: string,
): Promise<Result<void>> {
  try {
    await assertPermission(actorEmployeeId, BALANCE_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const promotion = await prisma.leavePromotion.findFirst({
    where: { id: promotionId, employee: { companyId: emp.companyId } },
  });
  if (!promotion) return err(errors.notFound("촉진 내역을 찾을 수 없어요"));

  if (promotion.status === "CANCELLED" || promotion.status === "COMPLETED") {
    return err(errors.forbidden("이미 종료된 촉진이에요"));
  }

  await prisma.leavePromotion.update({
    where: { id: promotionId },
    data: { status: "CANCELLED" },
  });
  return ok(undefined);
}
