-- CreateEnum
CREATE TYPE "FormDocumentKind" AS ENUM ('GENERAL', 'LEAVE_REQUEST', 'INFO_CHANGE', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "FormDocumentStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalLineStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ApprovalActionType" AS ENUM ('APPROVE', 'REJECT', 'DELEGATE', 'CANCEL');

-- CreateTable
CREATE TABLE "form_templates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "FormDocumentKind" NOT NULL DEFAULT 'GENERAL',
    "description" TEXT NOT NULL DEFAULT '',
    "fields" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_documents" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "templateId" TEXT,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "FormDocumentKind" NOT NULL DEFAULT 'GENERAL',
    "formData" JSONB NOT NULL DEFAULT '{}',
    "status" "FormDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_lines" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" "ApprovalLineStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_actions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "lineId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "ApprovalActionType" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "form_templates_companyId_isActive_idx" ON "form_templates"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "form_documents_companyId_status_idx" ON "form_documents"("companyId", "status");

-- CreateIndex
CREATE INDEX "form_documents_authorId_status_idx" ON "form_documents"("authorId", "status");

-- CreateIndex
CREATE INDEX "approval_lines_approverId_status_idx" ON "approval_lines"("approverId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "approval_lines_documentId_step_key" ON "approval_lines"("documentId", "step");

-- CreateIndex
CREATE INDEX "approval_actions_documentId_idx" ON "approval_actions"("documentId");

-- AddForeignKey
ALTER TABLE "form_templates" ADD CONSTRAINT "form_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_documents" ADD CONSTRAINT "form_documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_documents" ADD CONSTRAINT "form_documents_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "form_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_documents" ADD CONSTRAINT "form_documents_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_lines" ADD CONSTRAINT "approval_lines_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "form_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_lines" ADD CONSTRAINT "approval_lines_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_actions" ADD CONSTRAINT "approval_actions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "form_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_actions" ADD CONSTRAINT "approval_actions_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "approval_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_actions" ADD CONSTRAINT "approval_actions_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
