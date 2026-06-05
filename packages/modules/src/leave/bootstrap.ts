import { prisma } from "@teamlet/db";
import { KR_STATUTORY_LEAVE_TYPES } from "@teamlet/db/seed/leave-types";

export async function bootstrapCompanyLeaveTypes(companyId: string) {
  const results = await Promise.all(
    KR_STATUTORY_LEAVE_TYPES.map((lt) =>
      prisma.leaveType.upsert({
        where: { companyId_key: { companyId, key: lt.key } },
        create: {
          companyId,
          key: lt.key,
          name: lt.name,
          description: lt.description,
          isSystem: lt.isSystem,
          isRequired: lt.isRequired,
          grantMethod: lt.grantMethod,
          grantUnit: lt.grantUnit,
          grantAmount: lt.grantAmount ?? null,
          periodicCycle: lt.periodicCycle ?? null,
          paymentType: lt.paymentType,
          genderRestriction: lt.genderRestriction,
          evidenceRequirement: lt.evidenceRequirement,
        },
        update: {
          name: lt.name,
          description: lt.description,
        },
        select: { id: true },
      }),
    ),
  );
  return results.length;
}
