import { prisma } from "@teamlet/db";
import { ok, err, errors } from "@teamlet/shared";
import type { Result } from "@teamlet/shared";
import type { NotificationItem, CreateNotificationInput } from "./types";

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  await prisma.notification.create({
    data: {
      companyId: input.companyId,
      recipientEmployeeId: input.recipientEmployeeId,
      category: input.category,
      eventKey: input.eventKey,
      title: input.title,
      body: input.body,
      deepLink: input.deepLink,
      relatedTargetType: input.relatedTargetType,
      relatedTargetId: input.relatedTargetId,
    },
  });
}

export async function listNotifications(employeeId: string): Promise<Result<NotificationItem[]>> {
  const items = await prisma.notification.findMany({
    where: { recipientEmployeeId: employeeId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true, category: true, eventKey: true, title: true, body: true,
      deepLink: true, isRead: true, createdAt: true,
    },
  });
  return ok(items);
}

export async function markNotificationRead(employeeId: string, notificationId: string): Promise<Result<void>> {
  const notif = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { recipientEmployeeId: true },
  });
  if (!notif) return err(errors.notFound("알림을 찾을 수 없어요"));
  if (notif.recipientEmployeeId !== employeeId) return err(errors.forbidden());

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
  return ok(undefined);
}

export async function markAllNotificationsRead(employeeId: string): Promise<Result<void>> {
  await prisma.notification.updateMany({
    where: { recipientEmployeeId: employeeId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return ok(undefined);
}

export async function countUnreadNotifications(employeeId: string): Promise<number> {
  return prisma.notification.count({ where: { recipientEmployeeId: employeeId, isRead: false } });
}
