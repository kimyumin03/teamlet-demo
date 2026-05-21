import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { catchDomainErr } from "../permission/_actor";
import { assertPermission } from "../permission/assert";

const HOLIDAYS_MANAGE = "company.holidays.manage";

export type HolidayItem = {
  id: string;
  date: Date;
  name: string;
  isNational: boolean;
};

export async function listCompanyHolidays(
  actorEmployeeId: string,
  year?: number,
): Promise<Result<HolidayItem[]>> {
  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const targetYear = year ?? new Date().getFullYear();
  const start = new Date(`${targetYear}-01-01`);
  const end = new Date(`${targetYear + 1}-01-01`);

  const holidays = await prisma.companyHoliday.findMany({
    where: {
      companyId: emp.companyId,
      date: { gte: start, lt: end },
    },
    orderBy: { date: "asc" },
  });

  return ok(holidays.map((h) => ({ id: h.id, date: h.date, name: h.name, isNational: h.isNational })));
}

export async function addCompanyHoliday(
  actorEmployeeId: string,
  input: { date: string; name: string; isNational?: boolean },
): Promise<Result<{ id: string }>> {
  try {
    await assertPermission(actorEmployeeId, HOLIDAYS_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const dateVal = new Date(input.date);
  const existing = await prisma.companyHoliday.findUnique({
    where: { companyId_date: { companyId: emp.companyId, date: dateVal } },
  });
  if (existing) return err(errors.conflict("해당 날짜에 이미 공휴일이 등록돼 있어요"));

  const holiday = await prisma.companyHoliday.create({
    data: {
      companyId: emp.companyId,
      date: dateVal,
      name: input.name.trim(),
      isNational: input.isNational ?? false,
    },
  });

  return ok({ id: holiday.id });
}

export async function deleteCompanyHoliday(
  actorEmployeeId: string,
  holidayId: string,
): Promise<Result<void>> {
  try {
    await assertPermission(actorEmployeeId, HOLIDAYS_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const holiday = await prisma.companyHoliday.findFirst({
    where: { id: holidayId, companyId: emp.companyId },
  });
  if (!holiday) return err(errors.notFound("공휴일을 찾을 수 없어요"));

  await prisma.companyHoliday.delete({ where: { id: holidayId } });
  return ok(undefined);
}
