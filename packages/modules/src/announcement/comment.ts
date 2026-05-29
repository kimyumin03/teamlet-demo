import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import type { CommentItem } from "./types";

export async function listComments(
  employeeId: string,
  announcementId: string,
): Promise<Result<CommentItem[]>> {
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("구성원 정보를 찾을 수 없어요"));

  const ann = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: { companyId: true },
  });
  if (!ann || ann.companyId !== emp.companyId)
    return err(errors.notFound("공지사항을 찾을 수 없어요"));

  const rows = await prisma.announcementComment.findMany({
    where: { announcementId },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return ok(
    rows.map((r) => ({
      id: r.id,
      authorId: r.authorId,
      authorName: r.author.name,
      content: r.content,
      createdAt: r.createdAt,
    })),
  );
}

export async function createComment(
  employeeId: string,
  announcementId: string,
  content: string,
): Promise<Result<{ id: string }>> {
  const trimmed = content.trim();
  if (!trimmed) return err(errors.validation("댓글 내용을 입력해 주세요"));
  if (trimmed.length > 500) return err(errors.validation("댓글은 500자 이내로 입력해 주세요"));

  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("구성원 정보를 찾을 수 없어요"));

  const ann = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: { companyId: true },
  });
  if (!ann || ann.companyId !== emp.companyId)
    return err(errors.notFound("공지사항을 찾을 수 없어요"));

  const row = await prisma.announcementComment.create({
    data: { announcementId, authorId: employeeId, content: trimmed },
    select: { id: true },
  });

  return ok(row);
}

export async function deleteComment(
  employeeId: string,
  commentId: string,
): Promise<Result<void>> {
  const row = await prisma.announcementComment.findUnique({
    where: { id: commentId },
    select: { authorId: true, announcement: { select: { companyId: true } } },
  });
  if (!row) return err(errors.notFound("댓글을 찾을 수 없어요"));

  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true },
  });
  if (!emp || emp.companyId !== row.announcement.companyId)
    return err(errors.forbidden("권한이 없어요"));

  if (row.authorId !== employeeId)
    return err(errors.forbidden("본인 댓글만 삭제할 수 있어요"));

  await prisma.announcementComment.delete({ where: { id: commentId } });
  return ok(undefined);
}
