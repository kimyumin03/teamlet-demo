"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getCompanyLeaveSettings, updateCompanyLeaveSettings } from "@teamlet/modules/leave";
import type { CompanyLeaveSettingsUpdateInput } from "@teamlet/modules/leave";

export async function getCompanyLeaveSettingsAction() {
  const session = await auth();
  if (!session?.user?.employeeId) return { ok: false as const, error: { message: "로그인이 필요해요" } };
  return getCompanyLeaveSettings(session.user.employeeId);
}

export async function updateCompanyLeaveSettingsAction(input: CompanyLeaveSettingsUpdateInput) {
  const session = await auth();
  if (!session?.user?.employeeId) return { ok: false as const, error: { message: "로그인이 필요해요" } };
  const res = await updateCompanyLeaveSettings(session.user.employeeId, input);
  if (res.ok) revalidatePath("/settings/leave-policies");
  return res;
}
