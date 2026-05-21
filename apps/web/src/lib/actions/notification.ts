"use server";

import { auth } from "@/auth";
import { markNotificationRead, markAllNotificationsRead } from "@teamlet/modules/notification";
import { toApiResponse } from "@teamlet/shared";

async function getEmployeeId() {
  const session = await auth();
  const id = session?.user?.employeeId;
  if (!id) throw new Error("Unauthenticated");
  return id;
}

export async function markReadAction(notificationId: string) {
  const employeeId = await getEmployeeId();
  return toApiResponse(await markNotificationRead(employeeId, notificationId));
}

export async function markAllReadAction() {
  const employeeId = await getEmployeeId();
  return toApiResponse(await markAllNotificationsRead(employeeId));
}
