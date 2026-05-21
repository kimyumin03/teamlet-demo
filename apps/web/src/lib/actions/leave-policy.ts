"use server";

import { redirect } from "next/navigation";
import {
  listLeavePolicies,
  createLeavePolicy,
  updateLeavePolicy,
  deleteLeavePolicy,
  assignLeavePolicy,
  removeLeavePolicy,
} from "@teamlet/modules/leave";
import { leavePolicyCreateSchema, leavePolicyUpdateSchema, toApiResponse, type ApiResponse } from "@teamlet/shared";
import { auth } from "@/auth";
import type { LeavePolicyItem } from "@teamlet/modules/leave";

async function requireEmployee(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");
  return session.user.employeeId;
}

export async function listLeavePoliciesAction(): Promise<ApiResponse<LeavePolicyItem[]>> {
  const employeeId = await requireEmployee();
  return toApiResponse(await listLeavePolicies(employeeId));
}

export async function createLeavePolicyAction(
  raw: unknown,
): Promise<ApiResponse<{ id: string }>> {
  const employeeId = await requireEmployee();
  const parsed = leavePolicyCreateSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, error: { code: "VALIDATION", message: parsed.error.errors[0]?.message ?? "입력 오류" } };
  return toApiResponse(await createLeavePolicy(employeeId, parsed.data));
}

export async function updateLeavePolicyAction(
  policyId: string,
  raw: unknown,
): Promise<ApiResponse<void>> {
  const employeeId = await requireEmployee();
  const parsed = leavePolicyUpdateSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, error: { code: "VALIDATION", message: parsed.error.errors[0]?.message ?? "입력 오류" } };
  return toApiResponse(await updateLeavePolicy(employeeId, policyId, parsed.data));
}

export async function deleteLeavePolicyAction(policyId: string): Promise<ApiResponse<void>> {
  const employeeId = await requireEmployee();
  return toApiResponse(await deleteLeavePolicy(employeeId, policyId));
}

export async function assignLeavePolicyAction(
  policyId: string,
  targetEmployeeId: string,
  effectiveDate: string,
): Promise<ApiResponse<void>> {
  const employeeId = await requireEmployee();
  return toApiResponse(await assignLeavePolicy(employeeId, policyId, targetEmployeeId, effectiveDate));
}

export async function removeLeavePolicyAssignmentAction(
  assignmentId: string,
): Promise<ApiResponse<void>> {
  const employeeId = await requireEmployee();
  return toApiResponse(await removeLeavePolicy(employeeId, assignmentId));
}
