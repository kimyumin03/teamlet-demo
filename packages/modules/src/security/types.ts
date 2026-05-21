import type { MfaMethod } from "@teamlet/db";

export type SecurityPolicyItem = {
  mfaEnabled: boolean;
  mfaMethod: MfaMethod;
  mfaExemptIps: string[];
  ipRestrictionEnabled: boolean;
  allowedIps: string[];
  applyToSuperAdmin: boolean;
};

export type UpdateSecurityPolicyInput = Partial<SecurityPolicyItem>;

export type AuditLogItem = {
  id: string;
  occurredAt: Date;
  actorName: string | null;
  actorEmail: string | null;
  activityType: string;
  eventType: string;
  targetType: string;
  targetLabel: string | null;
  description: string;
  ipAddress: string | null;
};
