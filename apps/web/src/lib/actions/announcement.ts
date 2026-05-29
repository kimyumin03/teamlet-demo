"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@teamlet/db";
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  togglePin,
  listComments,
  createComment,
  deleteComment,
  type CommentItem,
} from "@teamlet/modules/announcement";
import { toApiResponse, type ApiResponse } from "@teamlet/shared";
import { auth } from "@/auth";

async function requireEmployee(): Promise<{ employeeId: string; companyId: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");
  const emp = await prisma.employee.findUnique({
    where: { id: session.user.employeeId },
    select: { companyId: true },
  });
  if (!emp) redirect("/join-company");
  return { employeeId: session.user.employeeId, companyId: emp.companyId };
}

export async function createAnnouncementAction(input: {
  title: string;
  content: string;
  isPinned?: boolean;
}): Promise<ApiResponse<{ id: string }>> {
  const { employeeId, companyId } = await requireEmployee();
  const result = await createAnnouncement({
    companyId,
    authorId: employeeId,
    title: input.title,
    content: input.content,
    isPinned: input.isPinned,
  });
  if (result.ok) revalidatePath("/home");
  return toApiResponse(result);
}

export async function updateAnnouncementAction(
  announcementId: string,
  input: { title?: string; content?: string; isPinned?: boolean },
): Promise<ApiResponse<void>> {
  const { employeeId } = await requireEmployee();
  const result = await updateAnnouncement(employeeId, announcementId, input);
  if (result.ok) revalidatePath("/home");
  return toApiResponse(result);
}

export async function deleteAnnouncementAction(
  announcementId: string,
): Promise<ApiResponse<void>> {
  const { employeeId } = await requireEmployee();
  const result = await deleteAnnouncement(employeeId, announcementId);
  if (result.ok) revalidatePath("/home");
  return toApiResponse(result);
}

export async function togglePinAction(
  announcementId: string,
): Promise<ApiResponse<void>> {
  const { employeeId } = await requireEmployee();
  const result = await togglePin(employeeId, announcementId);
  if (result.ok) revalidatePath("/home");
  return toApiResponse(result);
}

export async function listCommentsAction(
  announcementId: string,
): Promise<ApiResponse<CommentItem[]>> {
  const { employeeId } = await requireEmployee();
  const result = await listComments(employeeId, announcementId);
  return toApiResponse(result);
}

export async function createCommentAction(
  announcementId: string,
  content: string,
): Promise<ApiResponse<{ id: string }>> {
  const { employeeId } = await requireEmployee();
  const result = await createComment(employeeId, announcementId, content);
  return toApiResponse(result);
}

export async function deleteCommentAction(
  commentId: string,
): Promise<ApiResponse<void>> {
  const { employeeId } = await requireEmployee();
  const result = await deleteComment(employeeId, commentId);
  return toApiResponse(result);
}
