import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listCompanyHolidays } from "@teamlet/modules/tenancy";
import { HolidaysClient } from "@/components/company/holidays-client";

export const dynamic = "force-dynamic";

export default async function HolidaysPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");

  const { year: yearParam } = await searchParams;
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  const result = await listCompanyHolidays(session.user.employeeId, year);
  const holidays = result.ok ? result.data : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">공휴일 관리</h1>
        <p className="mt-0.5 text-[13px] text-foreground-muted">법정·자체 공휴일을 등록해 휴가 계산에 반영해요</p>
      </div>
      <HolidaysClient initialHolidays={holidays} year={year} />
    </div>
  );
}
