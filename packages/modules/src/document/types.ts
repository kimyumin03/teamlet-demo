import type { CompanyDocumentCategory, CertificateType } from "@teamlet/db";

export type CompanyDocumentItem = {
  id: string;
  title: string;
  category: CompanyDocumentCategory;
  fileUrl: string;
  isPublic: boolean;
  uploaderName: string;
  createdAt: Date;
};

export type CertificateIssueItem = {
  id: string;
  type: CertificateType;
  issueNumber: string;
  purpose: string;
  createdAt: Date;
  employeeName: string;
  issuerName: string;
  fileUrl: string | null;
};

export type CertificateDetail = CertificateIssueItem & {
  snapshotData: Record<string, unknown>;
};

export type CreateCompanyDocumentInput = {
  title: string;
  category: CompanyDocumentCategory;
  fileUrl: string;
  isPublic?: boolean;
};

export type IssueCertificateInput = {
  employeeId: string;
  templateId: string;
  purpose: string;
};

export type CertificateTemplateItem = {
  id: string;
  name: string;
  certType: CertificateType;
  fileUrl: string;
};

export type CreateCertificateTemplateInput = {
  name: string;
  certType: CertificateType;
  fileUrl: string;
};
