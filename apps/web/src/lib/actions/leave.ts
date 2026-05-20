"use server";

import { redirect } from "next/navigation";
import { requestLeave, approveLeave, rejectLeave, cancelLeave, grantLeave } from "@teamlet/modules/leave";
import { toApiResponse, type ApiResponse } from "@teamlet/shared";
import { auth } from "@/auth";

async function requireEmployee(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");
  return session.user.employeeId;
}

export async function requestLeaveAction(input: {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
}): Promise<ApiResponse<{ id: string }>> {
  const employeeId = await requireEmployee();
  return toApiResponse(
    await requestLeave({
      employeeId,
      leaveTypeId: input.leaveTypeId,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      days: input.days,
      reason: input.reason,
    }),
  );
}

export async function approveLeaveAction(requestId: string): Promise<ApiResponse<void>> {
  const actorId = await requireEmployee();
  return toApiResponse(await approveLeave(actorId, requestId));
}

export async function rejectLeaveAction(
  requestId: string,
  reviewNote?: string,
): Promise<ApiResponse<void>> {
  const actorId = await requireEmployee();
  return toApiResponse(await rejectLeave(actorId, requestId, reviewNote));
}

export async function cancelLeaveAction(requestId: string): Promise<ApiResponse<void>> {
  const employeeId = await requireEmployee();
  return toApiResponse(await cancelLeave(requestId, employeeId));
}

export async function grantLeaveAction(input: {
  employeeId: string;
  leaveTypeId: string;
  days: number;
  reason?: string;
}): Promise<ApiResponse<void>> {
  const actorId = await requireEmployee();
  return toApiResponse(
    await grantLeave(actorId, {
      employeeId: input.employeeId,
      leaveTypeId: input.leaveTypeId,
      days: input.days,
      category: "ANNUAL",
      reason: input.reason,
    }),
  );
}
