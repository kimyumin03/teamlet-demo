"use server";

import { redirect } from "next/navigation";
import {
  listLeavePolicies,
  createLeavePolicy,
  createDefaultLeavePolicy,
  updateLeavePolicy,
  deleteLeavePolicy,
  assignLeavePolicy,
  removeLeavePolicy,
  runAnnualLeaveGrant,
} from "@teamlet/modules/leave";
import { leavePolicyCreateSchema, leavePolicyUpdateSchema, toApiResponse, type ApiResponse } from "@teamlet/shared";
import { auth } from "@/auth";
import type { LeavePolicyItem, AutoGrantResult } from "@teamlet/modules/leave";

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

/** 기본 연차 정책 원클릭 생성 — 정책이 없는 회사 부트스트랩. 멱등. */
export async function createDefaultLeavePolicyAction(): Promise<ApiResponse<{ id: string }>> {
  const employeeId = await requireEmployee();
  return toApiResponse(await createDefaultLeavePolicy(employeeId));
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

/** 연차 자동부여 실행 — `leave.policy.manage` 가드 (모듈 내부). 멱등. */
export async function runAnnualLeaveGrantAction(
  year: number,
): Promise<ApiResponse<AutoGrantResult>> {
  const employeeId = await requireEmployee();
  return toApiResponse(await runAnnualLeaveGrant(employeeId, year));
}
