import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import type { AnnouncementItem, CreateAnnouncementInput, UpdateAnnouncementInput } from "./types";

export async function listAnnouncements(
  employeeId: string,
): Promise<Result<AnnouncementItem[]>> {
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("구성원 정보를 찾을 수 없어요"));

  const rows = await prisma.announcement.findMany({
    where: { companyId: emp.companyId },
    include: { author: { select: { name: true } } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return ok(
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      authorId: r.authorId,
      authorName: r.author.name,
      isPinned: r.isPinned,
      createdAt: r.createdAt,
    })),
  );
}

export async function createAnnouncement(
  input: CreateAnnouncementInput,
): Promise<Result<{ id: string }>> {
  if (!input.title.trim()) return err(errors.validation("제목을 입력해 주세요"));
  if (!input.content.trim()) return err(errors.validation("내용을 입력해 주세요"));

  const row = await prisma.announcement.create({
    data: {
      companyId: input.companyId,
      authorId: input.authorId,
      title: input.title.trim(),
      content: input.content.trim(),
      isPinned: input.isPinned ?? false,
    },
    select: { id: true },
  });

  return ok(row);
}

export async function updateAnnouncement(
  employeeId: string,
  announcementId: string,
  input: UpdateAnnouncementInput,
): Promise<Result<void>> {
  const row = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: { authorId: true, companyId: true },
  });
  if (!row) return err(errors.notFound("공지사항을 찾을 수 없어요"));

  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true },
  });
  if (!emp || emp.companyId !== row.companyId)
    return err(errors.forbidden("권한이 없어요"));

  // 작성자 본인만 수정 가능 (추후 관리자 권한 확장 가능)
  if (row.authorId !== employeeId)
    return err(errors.forbidden("작성자만 수정할 수 있어요"));

  await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.content !== undefined && { content: input.content.trim() }),
      ...(input.isPinned !== undefined && { isPinned: input.isPinned }),
    },
  });

  return ok(undefined);
}

export async function deleteAnnouncement(
  employeeId: string,
  announcementId: string,
): Promise<Result<void>> {
  const row = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: { authorId: true, companyId: true },
  });
  if (!row) return err(errors.notFound("공지사항을 찾을 수 없어요"));

  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true },
  });
  if (!emp || emp.companyId !== row.companyId)
    return err(errors.forbidden("권한이 없어요"));

  if (row.authorId !== employeeId)
    return err(errors.forbidden("작성자만 삭제할 수 있어요"));

  await prisma.announcement.delete({ where: { id: announcementId } });
  return ok(undefined);
}

export async function togglePin(
  employeeId: string,
  announcementId: string,
): Promise<Result<void>> {
  const row = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: { isPinned: true, companyId: true },
  });
  if (!row) return err(errors.notFound("공지사항을 찾을 수 없어요"));

  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true },
  });
  if (!emp || emp.companyId !== row.companyId)
    return err(errors.forbidden("권한이 없어요"));

  await prisma.announcement.update({
    where: { id: announcementId },
    data: { isPinned: !row.isPinned },
  });

  return ok(undefined);
}
