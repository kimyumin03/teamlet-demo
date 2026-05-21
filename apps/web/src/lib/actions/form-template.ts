"use server";

import { redirect } from "next/navigation";
import {
  listFormTemplates,
  createFormTemplate,
  updateFormTemplate,
  deleteFormTemplate,
} from "@teamlet/modules/workflow";
import { formTemplateCreateSchema, formTemplateUpdateSchema, toApiResponse, type ApiResponse } from "@teamlet/shared";
import { auth } from "@/auth";
import type { FormTemplateItem } from "@teamlet/modules/workflow";

async function requireEmployee(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");
  return session.user.employeeId;
}

export async function listFormTemplatesAction(): Promise<ApiResponse<FormTemplateItem[]>> {
  const employeeId = await requireEmployee();
  return toApiResponse(await listFormTemplates(employeeId));
}

export async function createFormTemplateAction(raw: unknown): Promise<ApiResponse<{ id: string }>> {
  const employeeId = await requireEmployee();
  const parsed = formTemplateCreateSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, error: { code: "VALIDATION", message: parsed.error.errors[0]?.message ?? "입력 오류" } };
  return toApiResponse(await createFormTemplate(employeeId, parsed.data));
}

export async function updateFormTemplateAction(
  templateId: string,
  raw: unknown,
): Promise<ApiResponse<void>> {
  const employeeId = await requireEmployee();
  const parsed = formTemplateUpdateSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, error: { code: "VALIDATION", message: parsed.error.errors[0]?.message ?? "입력 오류" } };
  return toApiResponse(await updateFormTemplate(employeeId, templateId, parsed.data));
}

export async function deleteFormTemplateAction(templateId: string): Promise<ApiResponse<void>> {
  const employeeId = await requireEmployee();
  return toApiResponse(await deleteFormTemplate(employeeId, templateId));
}
