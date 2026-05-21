-- CreateEnum
CREATE TYPE "MfaMethod" AS ENUM ('OTP', 'SMS', 'EMAIL');

-- CreateTable
CREATE TABLE "company_security_policies" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaMethod" "MfaMethod" NOT NULL DEFAULT 'OTP',
    "mfaExemptIps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ipRestrictionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "allowedIps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "applyToSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_security_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_security_policies_companyId_key" ON "company_security_policies"("companyId");

-- AddForeignKey
ALTER TABLE "company_security_policies" ADD CONSTRAINT "company_security_policies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
