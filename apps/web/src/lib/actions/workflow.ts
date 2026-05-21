"use server";

import { redirect } from "next/navigation";
import { prisma } from "@teamlet/db";
import { createDocument, approveDocument, rejectDocument } from "@teamlet/modules/workflow";
import type { FormDocumentKind } from "@teamlet/modules/workflow";
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
  return toApiResponse(await approveDocument(employeeId, lineId, comment));
}

export async function rejectDocumentAction(
  lineId: string,
  comment?: string,
): Promise<ApiResponse<void>> {
  const { employeeId } = await requireEmployee();
  return toApiResponse(await rejectDocument(employeeId, lineId, comment));
}
