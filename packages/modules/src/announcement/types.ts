export type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  isPinned: boolean;
  createdAt: Date;
};

export type CreateAnnouncementInput = {
  companyId: string;
  authorId: string;
  title: string;
  content: string;
  isPinned?: boolean;
};

export type UpdateAnnouncementInput = {
  title?: string;
  content?: string;
  isPinned?: boolean;
};
