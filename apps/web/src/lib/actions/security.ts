"use server";

import { auth } from "@/auth";
import { updateSecurityPolicy } from "@teamlet/modules/security";
import type { UpdateSecurityPolicyInput } from "@teamlet/modules/security";
import { toApiResponse } from "@teamlet/shared";

async function getEmployeeId() {
  const session = await auth();
  const id = session?.user?.employeeId;
  if (!id) throw new Error("Unauthenticated");
  return id;
}

export async function updateSecurityPolicyAction(input: UpdateSecurityPolicyInput) {
  const employeeId = await getEmployeeId();
  return toApiResponse(await updateSecurityPolicy(employeeId, input));
}
