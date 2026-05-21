import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { catchDomainErr } from "../permission/_actor";
import { assertPermission } from "../permission/assert";
import type { FormDocumentKind } from "./types";

const TEMPLATE_READ = "workflow.template.read";
const TEMPLATE_MANAGE = "workflow.template.manage";

export type FieldType = "text" | "textarea" | "number" | "date" | "select" | "checkbox";

export type FieldDef = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
};

export type FormTemplateItem = {
  id: string;
  name: string;
  kind: FormDocumentKind;
  description: string;
  fields: FieldDef[];
  isActive: boolean;
  documentCount: number;
  createdAt: Date;
};

export type FormTemplateCreateInput = {
  name: string;
  kind: FormDocumentKind;
  description?: string;
  fields: FieldDef[];
};

export type FormTemplateUpdateInput = Partial<FormTemplateCreateInput> & { isActive?: boolean };

export async function listFormTemplates(
  actorEmployeeId: string,
): Promise<Result<FormTemplateItem[]>> {
  try {
    await assertPermission(actorEmployeeId, TEMPLATE_READ);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const templates = await prisma.formTemplate.findMany({
    where: { companyId: emp.companyId },
    include: { _count: { select: { documents: true } } },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return ok(
    templates.map((t) => ({
      id: t.id,
      name: t.name,
      kind: t.kind as FormDocumentKind,
      description: t.description,
      fields: (t.fields as FieldDef[]) ?? [],
      isActive: t.isActive,
      documentCount: t._count.documents,
      createdAt: t.createdAt,
    })),
  );
}

export async function getFormTemplate(
  actorEmployeeId: string,
  templateId: string,
): Promise<Result<FormTemplateItem>> {
  try {
    await assertPermission(actorEmployeeId, TEMPLATE_READ);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const t = await prisma.formTemplate.findFirst({
    where: { id: templateId, companyId: emp.companyId },
    include: { _count: { select: { documents: true } } },
  });
  if (!t) return err(errors.notFound("양식을 찾을 수 없어요"));

  return ok({
    id: t.id,
    name: t.name,
    kind: t.kind as FormDocumentKind,
    description: t.description,
    fields: (t.fields as FieldDef[]) ?? [],
    isActive: t.isActive,
    documentCount: t._count.documents,
    createdAt: t.createdAt,
  });
}

export async function createFormTemplate(
  actorEmployeeId: string,
  input: FormTemplateCreateInput,
): Promise<Result<{ id: string }>> {
  try {
    await assertPermission(actorEmployeeId, TEMPLATE_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const t = await prisma.formTemplate.create({
    data: {
      companyId: emp.companyId,
      name: input.name,
      kind: input.kind,
      description: input.description ?? "",
      fields: input.fields as object[],
    },
  });

  return ok({ id: t.id });
}

export async function updateFormTemplate(
  actorEmployeeId: string,
  templateId: string,
  input: FormTemplateUpdateInput,
): Promise<Result<void>> {
  try {
    await assertPermission(actorEmployeeId, TEMPLATE_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const t = await prisma.formTemplate.findFirst({
    where: { id: templateId, companyId: emp.companyId },
  });
  if (!t) return err(errors.notFound("양식을 찾을 수 없어요"));

  await prisma.formTemplate.update({
    where: { id: templateId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.kind !== undefined && { kind: input.kind }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.fields !== undefined && { fields: input.fields as object[] }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });

  return ok(undefined);
}

export async function deleteFormTemplate(
  actorEmployeeId: string,
  templateId: string,
): Promise<Result<void>> {
  try {
    await assertPermission(actorEmployeeId, TEMPLATE_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const t = await prisma.formTemplate.findFirst({
    where: { id: templateId, companyId: emp.companyId },
    include: { _count: { select: { documents: true } } },
  });
  if (!t) return err(errors.notFound("양식을 찾을 수 없어요"));
  if (t._count.documents > 0)
    return err(errors.conflict("이 양식으로 작성된 문서가 있어 삭제할 수 없어요"));

  await prisma.formTemplate.delete({ where: { id: templateId } });
  return ok(undefined);
}
