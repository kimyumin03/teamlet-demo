import type { FormDocumentKind, FormDocumentStatus, ApprovalLineStatus } from "@teamlet/db";
import type { FieldDef } from "./template";

export type { FormDocumentKind, FormDocumentStatus, ApprovalLineStatus };

export type CreateDocumentInput = {
  companyId: string;
  authorId: string;
  title: string;
  kind: FormDocumentKind;
  templateId?: string;
  formData?: Record<string, unknown>;
  approverIds: string[];
  ccRecipientIds?: string[];
};

export type CcDocumentItem = {
  id: string;
  title: string;
  kind: FormDocumentKind;
  status: FormDocumentStatus;
  authorName: string;
  createdAt: Date;
  totalSteps: number;
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

export type DocumentDetail = {
  id: string;
  title: string;
  kind: FormDocumentKind;
  status: FormDocumentStatus;
  formData: Record<string, unknown>;
  templateFields: FieldDef[] | null;
  authorName: string;
  createdAt: Date;
  ccRecipients: { employeeId: string; name: string }[];
  approvalLines: {
    id: string;
    step: number;
    approverId: string;
    approverName: string;
    status: ApprovalLineStatus;
    approvedAt: Date | null;
    actions: {
      id: string;
      actorName: string;
      action: string;
      comment: string | null;
      createdAt: Date;
    }[];
  }[];
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
