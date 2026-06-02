"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancelLeavePromotion } from "@teamlet/modules/leave";
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
