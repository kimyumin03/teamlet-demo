import { prisma } from "@teamlet/db";
import type { AuditEventType } from "@teamlet/db";
import { ok, err, errors } from "@teamlet/shared";
import type { Result } from "@teamlet/shared";
import type { AuditLogItem } from "./types";

export type AuditLogFilter = {
  limit?: number;
  offset?: number;
  q?: string;
  activityType?: string;
  eventType?: string;
};

export async function listAuditLogs(
  employeeId: string,
  options: AuditLogFilter = {},
): Promise<Result<{ items: AuditLogItem[]; total: number }>> {
  const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { companyId: true } });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const { limit = 50, offset = 0, q, activityType, eventType } = options;

  const where = {
    companyId: emp.companyId,
    ...(activityType ? { activityType } : {}),
    ...(eventType ? { eventType: eventType as AuditEventType } : {}),
    ...(q
      ? {
          OR: [
            { description: { contains: q, mode: "insensitive" as const } },
            { actorName: { contains: q, mode: "insensitive" as const } },
            { actorEmail: { contains: q, mode: "insensitive" as const } },
            { targetLabel: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true, occurredAt: true, actorName: true, actorEmail: true,
        activityType: true, eventType: true, targetType: true, targetLabel: true,
        description: true, ipAddress: true,
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return ok({ items, total });
}
