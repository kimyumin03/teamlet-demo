import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { loadActor } from "../permission/_actor";

export type CalendarLeaveItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string | null;
  leaveTypeName: string;
  startDate: Date;
  endDate: Date;
  days: number;
};

export async function listTeamLeaveCalendar(
  actorEmployeeId: string,
  year: number,
  month: number,
): Promise<Result<CalendarLeaveItem[]>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0); // month 0일 = 전달의 마지막날

  const requests = await prisma.leaveRequest.findMany({
    where: {
      employee: { companyId: actor.companyId },
      status: "APPROVED",
      startDate: { lte: lastDay },
      endDate: { gte: firstDay },
    },
    include: {
      employee: {
        select: { name: true, department: { select: { name: true } } },
      },
      leaveType: { select: { name: true } },
    },
    orderBy: [{ startDate: "asc" }, { employee: { name: "asc" } }],
  });

  return ok(
    requests.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employee.name,
      departmentName: r.employee.department?.name ?? null,
      leaveTypeName: r.leaveType.name,
      startDate: r.startDate,
      endDate: r.endDate,
      days: Number(r.days),
    })),
  );
}
