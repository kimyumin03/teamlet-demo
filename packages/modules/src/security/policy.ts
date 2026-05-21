import { prisma } from "@teamlet/db";
import { ok, err, errors } from "@teamlet/shared";
import type { Result } from "@teamlet/shared";
import type { SecurityPolicyItem, UpdateSecurityPolicyInput } from "./types";

export async function getSecurityPolicy(employeeId: string): Promise<Result<SecurityPolicyItem>> {
  const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { companyId: true } });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const policy = await prisma.companySecurityPolicy.findUnique({ where: { companyId: emp.companyId } });

  if (!policy) {
    return ok({
      mfaEnabled: false,
      mfaMethod: "OTP" as const,
      mfaExemptIps: [],
      ipRestrictionEnabled: false,
      allowedIps: [],
      applyToSuperAdmin: false,
    });
  }

  return ok({
    mfaEnabled: policy.mfaEnabled,
    mfaMethod: policy.mfaMethod,
    mfaExemptIps: policy.mfaExemptIps,
    ipRestrictionEnabled: policy.ipRestrictionEnabled,
    allowedIps: policy.allowedIps,
    applyToSuperAdmin: policy.applyToSuperAdmin,
  });
}

export async function updateSecurityPolicy(
  employeeId: string,
  input: UpdateSecurityPolicyInput,
): Promise<Result<void>> {
  const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { companyId: true } });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  await prisma.companySecurityPolicy.upsert({
    where: { companyId: emp.companyId },
    create: { companyId: emp.companyId, ...input },
    update: input,
  });

  return ok(undefined);
}
