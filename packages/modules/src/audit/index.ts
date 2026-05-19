/**
 * 감사 로그 (docs/03 §9 기본형). Anti-Pattern §8: 도메인 mutation 은 항상 기록.
 * Phase 6 에서 InfoCategory/FieldClassification 강화.
 */
import { prisma } from "@teamlet/db";

export type AuditEventType =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "DOWNLOAD";

export type AuditInput = {
  companyId?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  activityType: string; // auth / tenancy / personal_info_access ...
  eventType: AuditEventType;
  targetType: string;
  targetId?: string | null;
  targetLabel?: string | null;
  description: string;
  beforeSnapshot?: unknown;
  afterSnapshot?: unknown;
  ip?: string | null;
  userAgent?: string | null;
};

export async function recordAudit(input: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      companyId: input.companyId ?? null,
      actorUserId: input.actorUserId ?? null,
      actorEmail: input.actorEmail ?? null,
      actorName: input.actorName ?? null,
      activityType: input.activityType,
      eventType: input.eventType,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      targetLabel: input.targetLabel ?? null,
      description: input.description,
      beforeSnapshot:
        input.beforeSnapshot === undefined
          ? undefined
          : JSON.parse(JSON.stringify(input.beforeSnapshot)),
      afterSnapshot:
        input.afterSnapshot === undefined
          ? undefined
          : JSON.parse(JSON.stringify(input.afterSnapshot)),
      ipAddress: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}
