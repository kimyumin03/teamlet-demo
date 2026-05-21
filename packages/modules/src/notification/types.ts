import type { NotificationCategory } from "@teamlet/db";

export type NotificationItem = {
  id: string;
  category: NotificationCategory;
  eventKey: string;
  title: string;
  body: string;
  deepLink: string | null;
  isRead: boolean;
  createdAt: Date;
};

export type CreateNotificationInput = {
  companyId: string;
  recipientEmployeeId: string;
  category: NotificationCategory;
  eventKey: string;
  title: string;
  body: string;
  deepLink?: string;
  relatedTargetType?: string;
  relatedTargetId?: string;
};
