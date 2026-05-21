import { prisma } from "@teamlet/db";
import { ok, err, errors } from "@teamlet/shared";
import type { Result } from "@teamlet/shared";
import type { CompanyDocumentItem, CreateCompanyDocumentInput } from "./types";

export async function listCompanyDocuments(employeeId: string): Promise<Result<CompanyDocumentItem[]>> {
  const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { companyId: true } });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const docs = await prisma.companyDocument.findMany({
    where: { companyId: emp.companyId },
    select: {
      id: true, title: true, category: true, fileUrl: true, isPublic: true, createdAt: true,
      uploadedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(docs.map((d) => ({
    id: d.id, title: d.title, category: d.category, fileUrl: d.fileUrl,
    isPublic: d.isPublic, uploaderName: d.uploadedBy.name, createdAt: d.createdAt,
  })));
}

export async function createCompanyDocument(
  employeeId: string,
  input: CreateCompanyDocumentInput,
): Promise<Result<{ id: string }>> {
  const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { companyId: true } });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  if (!input.title.trim()) return err(errors.validation("제목을 입력해주세요"));
  if (!input.fileUrl.trim()) return err(errors.validation("파일 URL을 입력해주세요"));

  const doc = await prisma.companyDocument.create({
    data: {
      companyId: emp.companyId,
      uploadedById: employeeId,
      title: input.title.trim(),
      category: input.category,
      fileUrl: input.fileUrl.trim(),
      isPublic: input.isPublic ?? true,
    },
    select: { id: true },
  });

  return ok({ id: doc.id });
}

export async function deleteCompanyDocument(
  employeeId: string,
  documentId: string,
): Promise<Result<void>> {
  const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { companyId: true } });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const doc = await prisma.companyDocument.findUnique({ where: { id: documentId }, select: { companyId: true } });
  if (!doc || doc.companyId !== emp.companyId) return err(errors.notFound("문서를 찾을 수 없어요"));

  await prisma.companyDocument.delete({ where: { id: documentId } });
  return ok(undefined);
}
