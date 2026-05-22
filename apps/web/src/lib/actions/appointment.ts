"use server";

import { redirect } from "next/navigation";
import { createAppointment } from "@teamlet/modules/appointment";
import {
  toApiResponse,
  type ApiResponse,
  type AppointmentCreateInput,
} from "@teamlet/shared";
import { auth } from "@/auth";

async function requireEmployeeId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");
  return session.user.employeeId;
}

/** 인사 발령 등록 — `member.directory.manage` 가드 (모듈 내부) */
export async function createAppointmentAction(
  input: AppointmentCreateInput,
): Promise<ApiResponse<{ appointmentId: string }>> {
  const employeeId = await requireEmployeeId();
  return toApiResponse(await createAppointment(employeeId, input));
}
