"use server";

import { redirect } from "next/navigation";
import { createPosition, deletePosition, updatePosition } from "@teamlet/modules/position";
import {
  toApiResponse,
  type ApiResponse,
  type PositionCreateInput,
} from "@teamlet/shared";
import { auth } from "@/auth";

async function requireEmployeeId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");
  return session.user.employeeId;
}

export async function createPositionAction(
  input: PositionCreateInput,
): Promise<ApiResponse<{ positionId: string }>> {
  const employeeId = await requireEmployeeId();
  return toApiResponse(await createPosition(employeeId, input));
}

export async function updatePositionAction(
  positionId: string,
  data: { name: string },
): Promise<ApiResponse<{ positionId: string }>> {
  const employeeId = await requireEmployeeId();
  return toApiResponse(await updatePosition(employeeId, positionId, data));
}

export async function deletePositionAction(
  positionId: string,
): Promise<ApiResponse<{ positionId: string }>> {
  const employeeId = await requireEmployeeId();
  return toApiResponse(await deletePosition(employeeId, positionId));
}
