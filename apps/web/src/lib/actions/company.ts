"use server";

import { redirect } from "next/navigation";
import { getCompanyInfo, updateCompanyInfo, addCompanyHoliday, deleteCompanyHoliday } from "@teamlet/modules/tenancy";
import { companyUpdateSchema, companyHolidayCreateSchema, toApiResponse, type ApiResponse } from "@teamlet/shared";
import { auth } from "@/auth";
import type { CompanyInfo, HolidayItem } from "@teamlet/modules/tenancy";

async function requireEmployee(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");
  return session.user.employeeId;
}

export async function getCompanyInfoAction(): Promise<ApiResponse<CompanyInfo>> {
  const employeeId = await requireEmployee();
  return toApiResponse(await getCompanyInfo(employeeId));
}

export async function updateCompanyInfoAction(raw: unknown): Promise<ApiResponse<void>> {
  const employeeId = await requireEmployee();
  const parsed = companyUpdateSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, error: { code: "VALIDATION", message: parsed.error.errors[0]?.message ?? "입력 오류" } };
  return toApiResponse(await updateCompanyInfo(employeeId, parsed.data));
}

export async function listCompanyHolidaysAction(year?: number): Promise<ApiResponse<HolidayItem[]>> {
  const employeeId = await requireEmployee();
  const { listCompanyHolidays } = await import("@teamlet/modules/tenancy");
  return toApiResponse(await listCompanyHolidays(employeeId, year));
}

export async function addCompanyHolidayAction(raw: unknown): Promise<ApiResponse<{ id: string }>> {
  const employeeId = await requireEmployee();
  const parsed = companyHolidayCreateSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, error: { code: "VALIDATION", message: parsed.error.errors[0]?.message ?? "입력 오류" } };
  return toApiResponse(await addCompanyHoliday(employeeId, parsed.data));
}

export async function deleteCompanyHolidayAction(holidayId: string): Promise<ApiResponse<void>> {
  const employeeId = await requireEmployee();
  return toApiResponse(await deleteCompanyHoliday(employeeId, holidayId));
}

export async function syncStatutoryHolidaysAction(
  year: number,
): Promise<ApiResponse<{ added: number; skipped: number }>> {
  const employeeId = await requireEmployee();
  const { syncStatutoryHolidays } = await import("@teamlet/modules/tenancy");
  return toApiResponse(await syncStatutoryHolidays(employeeId, year));
}

export async function syncStatutoryHolidaysRangeAction(
  fromYear: number,
  toYear: number,
): Promise<ApiResponse<{ added: number; skipped: number; years: number }>> {
  const employeeId = await requireEmployee();
  const { syncStatutoryHolidaysRange } = await import("@teamlet/modules/tenancy");
  return toApiResponse(await syncStatutoryHolidaysRange(employeeId, fromYear, toYear));
}
