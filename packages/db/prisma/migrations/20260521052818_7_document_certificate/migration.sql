-- CreateEnum
CREATE TYPE "CompanyDocumentCategory" AS ENUM ('GENERAL', 'NOTICE', 'POLICY');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('EMPLOYMENT', 'CAREER');

-- CreateTable
CREATE TABLE "company_documents" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "CompanyDocumentCategory" NOT NULL DEFAULT 'GENERAL',
    "fileUrl" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_issues" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "issuerId" TEXT NOT NULL,
    "type" "CertificateType" NOT NULL,
    "issueNumber" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificate_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_documents_companyId_category_idx" ON "company_documents"("companyId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_issues_issueNumber_key" ON "certificate_issues"("issueNumber");

-- CreateIndex
CREATE INDEX "certificate_issues_employeeId_idx" ON "certificate_issues"("employeeId");

-- AddForeignKey
ALTER TABLE "company_documents" ADD CONSTRAINT "company_documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_documents" ADD CONSTRAINT "company_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_issues" ADD CONSTRAINT "certificate_issues_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_issues" ADD CONSTRAINT "certificate_issues_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
