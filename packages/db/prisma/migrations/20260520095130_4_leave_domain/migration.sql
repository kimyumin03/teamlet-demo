-- CreateEnum
CREATE TYPE "LeaveTxCategory" AS ENUM ('MONTHLY', 'ANNUAL', 'EXTRA_GRANT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LeaveTxType" AS ENUM ('GRANT', 'EXPIRE', 'USE', 'ADJUST');

-- CreateTable
CREATE TABLE "company_holidays" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "isNational" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_transactions" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" "LeaveTxCategory" NOT NULL,
    "txType" "LeaveTxType" NOT NULL,
    "days" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "note" TEXT,
    "actorId" TEXT,
    "leaveRequestId" TEXT,

    CONSTRAINT "leave_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_holidays_companyId_idx" ON "company_holidays"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "company_holidays_companyId_date_key" ON "company_holidays"("companyId", "date");

-- CreateIndex
CREATE INDEX "leave_transactions_employeeId_leaveTypeId_idx" ON "leave_transactions"("employeeId", "leaveTypeId");

-- CreateIndex
CREATE INDEX "leave_transactions_leaveRequestId_idx" ON "leave_transactions"("leaveRequestId");

-- AddForeignKey
ALTER TABLE "company_holidays" ADD CONSTRAINT "company_holidays_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_transactions" ADD CONSTRAINT "leave_transactions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_transactions" ADD CONSTRAINT "leave_transactions_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_transactions" ADD CONSTRAINT "leave_transactions_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "leave_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_transactions" ADD CONSTRAINT "leave_transactions_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
