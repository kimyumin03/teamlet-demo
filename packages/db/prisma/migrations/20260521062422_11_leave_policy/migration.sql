-- CreateEnum
CREATE TYPE "LeavePolicyGrantMode" AS ENUM ('FISCAL_YEAR', 'HIRE_DATE');

-- CreateEnum
CREATE TYPE "MonthlyGrantRule" AS ENUM ('MONTHLY_ON_ATTENDANCE', 'LUMP_SUM_ON_HIRE_11', 'LUMP_SUM_UNTIL_FISCAL');

-- CreateEnum
CREATE TYPE "AnnualFirstYearRule" AS ENUM ('PRORATED_ON_FIRST_FISCAL', 'DAYS_15_ON_FIRST_FISCAL', 'DAYS_15_ON_ANNIVERSARY', 'LUMP_SUM_ON_HIRE_15');

-- CreateEnum
CREATE TYPE "DecimalRule" AS ENUM ('ROUND_UP_DAY', 'ROUND_UP_HALF', 'NO_ADJUSTMENT');

-- CreateTable
CREATE TABLE "leave_policies" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "grantMode" "LeavePolicyGrantMode" NOT NULL DEFAULT 'FISCAL_YEAR',
    "fiscalStartMonth" INTEGER NOT NULL DEFAULT 1,
    "monthlyGrantRule" "MonthlyGrantRule" NOT NULL DEFAULT 'MONTHLY_ON_ATTENDANCE',
    "annualFirstYearRule" "AnnualFirstYearRule" NOT NULL DEFAULT 'PRORATED_ON_FIRST_FISCAL',
    "decimalRule" "DecimalRule" NOT NULL DEFAULT 'ROUND_UP_DAY',
    "expiryMonths" INTEGER NOT NULL DEFAULT 12,
    "carryoverMaxDays" DECIMAL(65,30),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_policy_assignments" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "effectiveDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_policy_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leave_policies_companyId_isActive_idx" ON "leave_policies"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "leave_policy_assignments_employeeId_idx" ON "leave_policy_assignments"("employeeId");

-- CreateIndex
CREATE INDEX "leave_policy_assignments_policyId_idx" ON "leave_policy_assignments"("policyId");

-- AddForeignKey
ALTER TABLE "leave_policies" ADD CONSTRAINT "leave_policies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_policies" ADD CONSTRAINT "leave_policies_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_policy_assignments" ADD CONSTRAINT "leave_policy_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_policy_assignments" ADD CONSTRAINT "leave_policy_assignments_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "leave_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
