"use server";

import { auth } from "@/auth";
import {
  createCompanyDocument, deleteCompanyDocument, issueCertificate,
  listCertificateTemplates, createCertificateTemplate, deleteCertificateTemplate,
} from "@teamlet/modules/document";
import type { CreateCompanyDocumentInput, IssueCertificateInput, CreateCertificateTemplateInput } from "@teamlet/modules/document";
import { toApiResponse } from "@teamlet/shared";

async function getEmployeeId() {
  const session = await auth();
  const id = session?.user?.employeeId;
  if (!id) throw new Error("Unauthenticated");
  return id;
}

export async function createCompanyDocumentAction(input: CreateCompanyDocumentInput) {
  const employeeId = await getEmployeeId();
  return toApiResponse(await createCompanyDocument(employeeId, input));
}

export async function deleteCompanyDocumentAction(documentId: string) {
  const employeeId = await getEmployeeId();
  return toApiResponse(await deleteCompanyDocument(employeeId, documentId));
}

export async function issueCertificateAction(input: IssueCertificateInput) {
  const employeeId = await getEmployeeId();
  return toApiResponse(await issueCertificate(employeeId, input));
}

export async function listCertificateTemplatesAction() {
  const employeeId = await getEmployeeId();
  return toApiResponse(await listCertificateTemplates(employeeId));
}

export async function createCertificateTemplateAction(input: CreateCertificateTemplateInput) {
  const employeeId = await getEmployeeId();
  return toApiResponse(await createCertificateTemplate(employeeId, input));
}

export async function deleteCertificateTemplateAction(templateId: string) {
  const employeeId = await getEmployeeId();
  return toApiResponse(await deleteCertificateTemplate(employeeId, templateId));
}
