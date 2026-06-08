import { prisma } from "@teamlet/db";
import { KR_STATUTORY_LEAVE_TYPES } from "@teamlet/db/seed/leave-types";

export async function bootstrapCompanyLeaveTypes(companyId: string) {
  // 법정 필수(isRequired)만 일괄 등록 — 선택 휴가는 "맞춤 휴가 추가"로 개별 등록
  const results = await Promise.all(
    KR_STATUTORY_LEAVE_TYPES.filter((lt) => lt.isRequired).map((lt) =>
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
          partialPayDays: lt.partialPayDays ?? null,
          deductOnHoliday: lt.deductOnHoliday ?? false,
          genderRestriction: lt.genderRestriction,
          evidenceRequirement: lt.evidenceRequirement,
        },
        update: {
          // 법정 휴가는 법령 기준으로 갱신(필수/급여/일수/성별 등) — 사용자 지정 승인선·참조는 보존
          name: lt.name,
          description: lt.description,
          isSystem: lt.isSystem,
          isRequired: lt.isRequired,
          grantMethod: lt.grantMethod,
          grantUnit: lt.grantUnit,
          grantAmount: lt.grantAmount ?? null,
          paymentType: lt.paymentType,
          partialPayDays: lt.partialPayDays ?? null,
          deductOnHoliday: lt.deductOnHoliday ?? false,
          genderRestriction: lt.genderRestriction,
          evidenceRequirement: lt.evidenceRequirement,
        },
        select: { id: true },
      }),
    ),
  );
  return results.length;
}
