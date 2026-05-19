-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'LEFT');

-- CreateEnum
CREATE TYPE "JoinPath" AS ENUM ('APPLICATION', 'INVITE', 'COMPANY_CODE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CompanyJoinPolicy" AS ENUM ('REQUIRE_APPROVAL', 'OPEN', 'INVITE_ONLY');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'PROBATION', 'ON_LEAVE', 'SECONDED', 'RESIGNED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('MANUAL', 'CSV_IMPORT', 'AXHUB_API');

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('SYSTEM_SUPER_ADMIN', 'DYNAMIC_ORG_HEAD', 'DEFAULT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('READ', 'MANAGE', 'EXECUTE');

-- CreateEnum
CREATE TYPE "PermissionSensitivity" AS ENUM ('NORMAL', 'SENSITIVE', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('ALL', 'DEPARTMENT', 'DIRECT_REPORTS', 'SELF');

-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'DOWNLOAD');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "axhubUserId" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessNumber" TEXT NOT NULL,
    "corporateNumber" TEXT,
    "phone" TEXT,
    "foundedAt" TIMESTAMP(3),
    "addressRoad" TEXT,
    "addressDetail" TEXT,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "companyCode" TEXT NOT NULL,
    "companyCodeActive" BOOLEAN NOT NULL DEFAULT true,
    "joinPolicy" "CompanyJoinPolicy" NOT NULL DEFAULT 'REQUIRE_APPROVAL',
    "visionMission" TEXT,
    "isSetupCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_company_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT,
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "joinPath" "JoinPath" NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_company_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_applications" (
    "id" TEXT NOT NULL,
    "applicantUserId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "businessNumber" TEXT NOT NULL,
    "representativeName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "companySize" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "memo" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewMemo" TEXT,
    "createdCompanyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "join_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "usedCompanyCode" TEXT NOT NULL,
    "payload" JSONB,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewMemo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_invites" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "inviterUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "prefilledData" JSONB,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employeeNumber" TEXT,
    "companyEmail" TEXT,
    "personalEmail" TEXT,
    "hireDate" TIMESTAMP(3),
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "dataSource" "DataSource" NOT NULL DEFAULT 'MANUAL',
    "axhubExternalId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncLockedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bulkImportRowId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "type" "RoleType" NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sensitivity" "PermissionSensitivity" NOT NULL DEFAULT 'NORMAL',
    "hasScope" BOOLEAN NOT NULL DEFAULT false,
    "dependsOnPermissionKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "warningText" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "scopeType" "ScopeType",
    "departmentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "includeSubDepartments" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedByUserId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_login_policies" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "minLength" INTEGER NOT NULL DEFAULT 8,
    "requireAlpha" BOOLEAN NOT NULL DEFAULT true,
    "requireDigit" BOOLEAN NOT NULL DEFAULT true,
    "requireSpecial" BOOLEAN NOT NULL DEFAULT true,
    "blockWeakPasswords" BOOLEAN NOT NULL DEFAULT true,
    "blockPersonalInfo" BOOLEAN NOT NULL DEFAULT true,
    "preventReuseCount" INTEGER NOT NULL DEFAULT 3,
    "passwordExpiryDays" INTEGER,
    "maxLoginAttempts" INTEGER NOT NULL DEFAULT 5,
    "pcSessionMaxAgeHours" INTEGER NOT NULL DEFAULT 168,
    "mobileSessionMaxAgeHours" INTEGER NOT NULL DEFAULT 720,
    "allowLeaveOfAbsenceLogin" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "company_login_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "failReason" TEXT,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "actorName" TEXT,
    "onBehalfOfUserId" TEXT,
    "activityType" TEXT NOT NULL,
    "eventType" "AuditEventType" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "targetLabel" TEXT,
    "description" TEXT NOT NULL,
    "beforeSnapshot" JSONB,
    "afterSnapshot" JSONB,
    "diff" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "requestId" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_axhubUserId_key" ON "users"("axhubUserId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_businessNumber_key" ON "companies"("businessNumber");

-- CreateIndex
CREATE UNIQUE INDEX "companies_companyCode_key" ON "companies"("companyCode");

-- CreateIndex
CREATE UNIQUE INDEX "user_company_memberships_employeeId_key" ON "user_company_memberships"("employeeId");

-- CreateIndex
CREATE INDEX "user_company_memberships_companyId_status_idx" ON "user_company_memberships"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_company_memberships_userId_companyId_key" ON "user_company_memberships"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "company_applications_createdCompanyId_key" ON "company_applications"("createdCompanyId");

-- CreateIndex
CREATE INDEX "company_applications_status_createdAt_idx" ON "company_applications"("status", "createdAt");

-- CreateIndex
CREATE INDEX "join_requests_companyId_status_createdAt_idx" ON "join_requests"("companyId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "join_requests_userId_companyId_key" ON "join_requests"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_invites_tokenHash_key" ON "employee_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "employee_invites_companyId_used_idx" ON "employee_invites"("companyId", "used");

-- CreateIndex
CREATE INDEX "departments_companyId_parentId_idx" ON "departments"("companyId", "parentId");

-- CreateIndex
CREATE INDEX "employees_companyId_employmentStatus_idx" ON "employees"("companyId", "employmentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "employees_companyId_axhubExternalId_key" ON "employees"("companyId", "axhubExternalId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_companyId_name_key" ON "roles"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "permissions_category_idx" ON "permissions"("category");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_employeeId_roleId_key" ON "user_roles"("employeeId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "company_login_policies_companyId_key" ON "company_login_policies"("companyId");

-- CreateIndex
CREATE INDEX "login_attempts_email_attemptedAt_idx" ON "login_attempts"("email", "attemptedAt");

-- CreateIndex
CREATE INDEX "audit_logs_companyId_occurredAt_idx" ON "audit_logs"("companyId", "occurredAt");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "user_company_memberships" ADD CONSTRAINT "user_company_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_memberships" ADD CONSTRAINT "user_company_memberships_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_memberships" ADD CONSTRAINT "user_company_memberships_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_applications" ADD CONSTRAINT "company_applications_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_applications" ADD CONSTRAINT "company_applications_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_applications" ADD CONSTRAINT "company_applications_createdCompanyId_fkey" FOREIGN KEY ("createdCompanyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_invites" ADD CONSTRAINT "employee_invites_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_invites" ADD CONSTRAINT "employee_invites_inviterUserId_fkey" FOREIGN KEY ("inviterUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_login_policies" ADD CONSTRAINT "company_login_policies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

