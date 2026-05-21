/**
 * 플랫폼 운영자(SaaS 운영팀)용 조회 — 회사 신청 / 전체 회사.
 *
 * 회사 권한 시스템(`assertPermission`)과 무관 — 플랫폼 관리자는 특정 회사
 * 소속이 아닐 수 있다. 접근 가드는 호출처(플랫폼 관리자 콘솔)에서 적용.
 */

import { prisma } from "@teamlet/db";
import type { ApplicationStatus } from "@teamlet/db";

export type CompanyApplicationItem = {
  id: string;
  companyName: string;
  businessNumber: string;
  representativeName: string;
  contact: string;
  companySize: string;
  industry: string;
  memo: string | null;
  status: ApplicationStatus;
  applicantName: string;
  applicantEmail: string;
  reviewedAt: Date | null;
  reviewMemo: string | null;
  createdCompanyId: string | null;
  createdAt: Date;
};

/** 회사 등록 신청 목록 — status 미지정 시 전체. */
export async function listCompanyApplications(
  statusFilter?: ApplicationStatus,
): Promise<CompanyApplicationItem[]> {
  const apps = await prisma.companyApplication.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    include: { applicant: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return apps.map((a) => ({
    id: a.id,
    companyName: a.companyName,
    businessNumber: a.businessNumber,
    representativeName: a.representativeName,
    contact: a.contact,
    companySize: a.companySize,
    industry: a.industry,
    memo: a.memo,
    status: a.status,
    applicantName: a.applicant.name,
    applicantEmail: a.applicant.email,
    reviewedAt: a.reviewedAt,
    reviewMemo: a.reviewMemo,
    createdCompanyId: a.createdCompanyId,
    createdAt: a.createdAt,
  }));
}

export type CompanyAdminItem = {
  id: string;
  name: string;
  businessNumber: string;
  companyCode: string;
  isActive: boolean;
  employeeCount: number;
  createdAt: Date;
};

/** 플랫폼 전체 회사 목록. */
export async function listAllCompanies(): Promise<CompanyAdminItem[]> {
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      businessNumber: true,
      companyCode: true,
      isActive: true,
      createdAt: true,
      _count: { select: { employees: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return companies.map((c) => ({
    id: c.id,
    name: c.name,
    businessNumber: c.businessNumber,
    companyCode: c.companyCode,
    isActive: c.isActive,
    employeeCount: c._count.employees,
    createdAt: c.createdAt,
  }));
}

/** 플랫폼 대시보드 요약 통계. */
export async function getPlatformStats(): Promise<{
  pendingApplications: number;
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
}> {
  const [pendingApplications, totalCompanies, activeCompanies, totalUsers] =
    await Promise.all([
      prisma.companyApplication.count({ where: { status: "PENDING" } }),
      prisma.company.count(),
      prisma.company.count({ where: { isActive: true } }),
      prisma.user.count(),
    ]);

  return { pendingApplications, totalCompanies, activeCompanies, totalUsers };
}
