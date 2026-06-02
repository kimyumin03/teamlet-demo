"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancelLeavePromotion, submitLeavePlan, getLeavePromotionDetail } from "@teamlet/modules/leave";
import type { LeavePromotionDetail } from "@teamlet/modules/leave";
import { toApiResponse, type ApiResponse } from "@teamlet/shared";
import { auth } from "@/auth";

async function requireEmployee(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");
  return session.user.employeeId;
}

export async function cancelLeavePromotionAction(promotionId: string): Promise<ApiResponse<void>> {
  const employeeId = await requireEmployee();
  const result = await cancelLeavePromotion(employeeId, promotionId);
  if (result.ok) revalidatePath("/hr/leave");
  return toApiResponse(result);
}

/** 연차 사용 계획 상세 (관리자 사이드 패널) */
export async function getLeavePromotionDetailAction(
  promotionId: string,
): Promise<ApiResponse<LeavePromotionDetail>> {
  const employeeId = await requireEmployee();
  return toApiResponse(await getLeavePromotionDetail(employeeId, promotionId));
}

/** 연차 사용 계획 제출 — 사용 희망일(YYYY-MM-DD[]) → FormDocument 결재 */
export async function submitLeavePlanAction(
  promotionId: string,
  planDates: string[],
): Promise<ApiResponse<{ id: string }>> {
  const employeeId = await requireEmployee();
  const result = await submitLeavePlan(
    employeeId,
    promotionId,
    planDates.map((d) => new Date(d)),
  );
  if (result.ok) {
    revalidatePath("/leave");
    revalidatePath("/hr/leave");
  }
  return toApiResponse(result);
}
