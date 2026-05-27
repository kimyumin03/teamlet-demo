"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  listApprovalPolicies,
  createApprovalPolicy,
  updateApprovalPolicy,
  deleteApprovalPolicy,
} from "@teamlet/modules/workflow";
import type { ApprovalPolicyCreateInput, ApprovalPolicyUpdateInput } from "@teamlet/modules/workflow";
import { toApiResponse, type ApiResponse } from "@teamlet/shared";
import { auth } from "@/auth";

async function requireEmployee(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");
  return session.user.employeeId;
}

export async function createApprovalPolicyAction(
  input: ApprovalPolicyCreateInput,
): Promise<ApiResponse<{ id: string }>> {
  const actorId = await requireEmployee();
  const result = await createApprovalPolicy(actorId, input);
  if (result.ok) revalidatePath("/settings/approval-policies");
  return toApiResponse(result);
}

export async function updateApprovalPolicyAction(
  policyId: string,
  input: ApprovalPolicyUpdateInput,
): Promise<ApiResponse<void>> {
  const actorId = await requireEmployee();
  const result = await updateApprovalPolicy(actorId, policyId, input);
  if (result.ok) revalidatePath("/settings/approval-policies");
  return toApiResponse(result);
}

export async function deleteApprovalPolicyAction(
  policyId: string,
): Promise<ApiResponse<void>> {
  const actorId = await requireEmployee();
  const result = await deleteApprovalPolicy(actorId, policyId);
  if (result.ok) revalidatePath("/settings/approval-policies");
  return toApiResponse(result);
}
