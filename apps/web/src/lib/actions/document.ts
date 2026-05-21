"use server";

import { auth } from "@/auth";
import { createCompanyDocument, deleteCompanyDocument, issueCertificate } from "@teamlet/modules/document";
import type { CreateCompanyDocumentInput, IssueCertificateInput } from "@teamlet/modules/document";
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
