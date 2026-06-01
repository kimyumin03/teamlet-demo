"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  bootstrapCompanyLeaveTypes,
} from "@teamlet/modules/leave";
import type { LeaveTypeCreateInput, LeaveTypeUpdateInput } from "@teamlet/modules/leave";
import { prisma } from "@teamlet/db";

type ApiResponse<T = void> = { ok: true; data: T } | { ok: false; error: { message: string } };

function revalidate() {
  revalidatePath("/settings/leave-types");
}

async function getEmployeeId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.employeeId ?? null;
}

export async function createLeaveTypeAction(
  input: LeaveTypeCreateInput,
): Promise<ApiResponse<{ id: string }>> {
  const employeeId = await getEmployeeId();
  if (!employeeId) return { ok: false, error: { message: "인증이 필요해요" } };
  const result = await createLeaveType(employeeId, input);
  if (!result.ok) return { ok: false, error: { message: result.error.message } };
  revalidate();
  return { ok: true, data: result.data };
}

export async function updateLeaveTypeAction(
  leaveTypeId: string,
  input: LeaveTypeUpdateInput,
): Promise<ApiResponse> {
  const employeeId = await getEmployeeId();
  if (!employeeId) return { ok: false, error: { message: "인증이 필요해요" } };
  const result = await updateLeaveType(employeeId, leaveTypeId, input);
  if (!result.ok) return { ok: false, error: { message: result.error.message } };
  revalidate();
  return { ok: true, data: undefined };
}

export async function deleteLeaveTypeAction(
  leaveTypeId: string,
): Promise<ApiResponse> {
  const employeeId = await getEmployeeId();
  if (!employeeId) return { ok: false, error: { message: "인증이 필요해요" } };
  const result = await deleteLeaveType(employeeId, leaveTypeId);
  if (!result.ok) return { ok: false, error: { message: result.error.message } };
  revalidate();
  return { ok: true, data: undefined };
}

export async function bootstrapLeaveTypesAction(): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.employeeId) return { ok: false, error: "인증이 필요해요" };
  const emp = await prisma.employee.findUnique({
    where: { id: session.user.employeeId },
    select: { companyId: true },
  });
  if (!emp) return { ok: false, error: "직원 정보를 찾을 수 없어요" };
  await bootstrapCompanyLeaveTypes(emp.companyId);
  revalidatePath("/settings/leave-policies");
  revalidatePath("/settings/leave-types");
  return { ok: true };
}
