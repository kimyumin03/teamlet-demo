"use server";

import { redirect } from "next/navigation";
import { requestLeave, approveLeave, rejectLeave, cancelLeave, grantLeave } from "@teamlet/modules/leave";
import { createNotification } from "@teamlet/modules/notification";
import { toApiResponse, type ApiResponse } from "@teamlet/shared";
import { auth } from "@/auth";
import { prisma } from "@teamlet/db";

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
  const req = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    select: { employeeId: true, employee: { select: { companyId: true } } },
  });
  const result = await approveLeave(actorId, requestId);
  if (result.ok && req) {
    await createNotification({
      companyId: req.employee.companyId,
      recipientEmployeeId: req.employeeId,
      category: "LEAVE",
      eventKey: "leave.approved",
      title: "휴가 신청이 승인됐어요",
      body: "신청하신 휴가가 승인됐어요.",
      deepLink: "/leave",
      relatedTargetType: "leave_request",
      relatedTargetId: requestId,
    }).catch(() => {});
  }
  return toApiResponse(result);
}

export async function rejectLeaveAction(
  requestId: string,
  reviewNote?: string,
): Promise<ApiResponse<void>> {
  const actorId = await requireEmployee();
  const req = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    select: { employeeId: true, employee: { select: { companyId: true } } },
  });
  const result = await rejectLeave(actorId, requestId, reviewNote);
  if (result.ok && req) {
    await createNotification({
      companyId: req.employee.companyId,
      recipientEmployeeId: req.employeeId,
      category: "LEAVE",
      eventKey: "leave.rejected",
      title: "휴가 신청이 반려됐어요",
      body: reviewNote ? `반려 사유: ${reviewNote}` : "신청하신 휴가가 반려됐어요.",
      deepLink: "/leave",
      relatedTargetType: "leave_request",
      relatedTargetId: requestId,
    }).catch(() => {});
  }
  return toApiResponse(result);
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
