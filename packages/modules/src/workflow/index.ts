export { getDocument, createDocument, listMyDocuments, listEmployeeDocuments, listPendingApprovals } from "./document";
export { approveDocument, rejectDocument } from "./approval";
export { listFormTemplates, getFormTemplate, createFormTemplate, updateFormTemplate, deleteFormTemplate } from "./template";
export type { CreateDocumentInput, DocumentListItem, DocumentDetail, PendingApprovalItem, FormDocumentKind, FormDocumentStatus } from "./types";
export type { FormTemplateItem, FormTemplateCreateInput, FormTemplateUpdateInput, FieldDef, FieldType } from "./template";
