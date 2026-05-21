"use server";

import { redirect } from "next/navigation";
import { prisma } from "@teamlet/db";
import { createDocument, approveDocument, rejectDocument } from "@teamlet/modules/workflow";
import type { FormDocumentKind } from "@teamlet/modules/workflow";
import { createNotification } from "@teamlet/modules/notification";
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

export async function createDocumentAction(input: {
  title: string;
  kind: FormDocumentKind;
  templateId?: string;
  approverIds: string[];
  formData?: Record<string, unknown>;
}): Promise<ApiResponse<{ id: string }>> {
  const { employeeId, companyId } = await requireEmployee();
  return toApiResponse(
    await createDocument({
      companyId,
      authorId: employeeId,
      title: input.title,
      kind: input.kind,
      templateId: input.templateId,
      approverIds: input.approverIds,
      formData: input.formData,
    }),
  );
}

export async function approveDocumentAction(
  lineId: string,
  comment?: string,
): Promise<ApiResponse<void>> {
  const { employeeId } = await requireEmployee();
  const line = await prisma.approvalLine.findUnique({
    where: { id: lineId },
    select: { document: { select: { id: true, title: true, authorId: true, author: { select: { companyId: true } } } } },
  });
  const result = await approveDocument(employeeId, lineId, comment);
  if (result.ok && line) {
    const { document: doc } = line;
    await createNotification({
      companyId: doc.author.companyId,
      recipientEmployeeId: doc.authorId,
      category: "APPROVAL",
      eventKey: "approval.approved",
      title: `'${doc.title}' 문서가 승인됐어요`,
      body: comment ? `승인 의견: ${comment}` : "결재가 완료됐어요.",
      deepLink: `/workflow/documents/${doc.id}`,
      relatedTargetType: "form_document",
      relatedTargetId: doc.id,
    }).catch(() => {});
  }
  return toApiResponse(result);
}

export async function rejectDocumentAction(
  lineId: string,
  comment?: string,
): Promise<ApiResponse<void>> {
  const { employeeId } = await requireEmployee();
  const line = await prisma.approvalLine.findUnique({
    where: { id: lineId },
    select: { document: { select: { id: true, title: true, authorId: true, author: { select: { companyId: true } } } } },
  });
  const result = await rejectDocument(employeeId, lineId, comment);
  if (result.ok && line) {
    const { document: doc } = line;
    await createNotification({
      companyId: doc.author.companyId,
      recipientEmployeeId: doc.authorId,
      category: "APPROVAL",
      eventKey: "approval.rejected",
      title: `'${doc.title}' 문서가 반려됐어요`,
      body: comment ? `반려 사유: ${comment}` : "결재가 반려됐어요.",
      deepLink: `/workflow/documents/${doc.id}`,
      relatedTargetType: "form_document",
      relatedTargetId: doc.id,
    }).catch(() => {});
  }
  return toApiResponse(result);
}
