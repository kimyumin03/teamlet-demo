import { prisma } from "@teamlet/db";
import { ok, err, errors } from "@teamlet/shared";
import type { Result } from "@teamlet/shared";
import type { AuditLogItem } from "./types";

export async function listAuditLogs(
  employeeId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<Result<{ items: AuditLogItem[]; total: number }>> {
  const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { companyId: true } });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const { limit = 50, offset = 0 } = options;

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { companyId: emp.companyId },
      orderBy: { occurredAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true, occurredAt: true, actorName: true, actorEmail: true,
        activityType: true, eventType: true, targetType: true, targetLabel: true,
        description: true, ipAddress: true,
      },
    }),
    prisma.auditLog.count({ where: { companyId: emp.companyId } }),
  ]);

  return ok({ items, total });
}
