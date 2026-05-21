import type { FormDocumentKind, FormDocumentStatus, ApprovalLineStatus } from "@teamlet/db";

export type { FormDocumentKind, FormDocumentStatus, ApprovalLineStatus };

export type CreateDocumentInput = {
  companyId: string;
  authorId: string;
  title: string;
  kind: FormDocumentKind;
  templateId?: string;
  formData?: Record<string, unknown>;
  approverIds: string[];
};

export type DocumentListItem = {
  id: string;
  title: string;
  kind: FormDocumentKind;
  status: FormDocumentStatus;
  authorName: string;
  createdAt: Date;
  currentStep: number | null;
  totalSteps: number;
};

export type PendingApprovalItem = {
  id: string;
  documentId: string;
  documentTitle: string;
  documentKind: FormDocumentKind;
  authorName: string;
  step: number;
  totalSteps: number;
  createdAt: Date;
};
