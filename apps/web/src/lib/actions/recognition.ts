"use server";

import { redirect } from "next/navigation";
import { sendRecognition, markRecognitionsRead, deleteRecognition, type RecognitionKindValue } from "@teamlet/modules/recognition";
import { toApiResponse, type ApiResponse } from "@teamlet/shared";
import { auth } from "@/auth";

async function requireEmployee(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");
  return session.user.employeeId;
}

export async function sendRecognitionAction(input: {
  recipientId: string;
  kind: RecognitionKindValue;
  message: string;
}): Promise<ApiResponse<{ id: string }>> {
  const senderId = await requireEmployee();
  return toApiResponse(await sendRecognition(senderId, input));
}

export async function markRecognitionsReadAction(): Promise<ApiResponse<void>> {
  const employeeId = await requireEmployee();
  return toApiResponse(await markRecognitionsRead(employeeId));
}

export async function deleteRecognitionAction(recognitionId: string): Promise<ApiResponse<void>> {
  const employeeId = await requireEmployee();
  return toApiResponse(await deleteRecognition(employeeId, recognitionId));
}
