import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";

export type CompanyInfo = {
  id: string;
  name: string;
  businessNumber: string;
  corporateNumber: string | null;
  phone: string | null;
  foundedAt: Date | null;
  addressRoad: string | null;
  addressDetail: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  companyCode: string;
  companyCodeActive: boolean;
  visionMission: string | null;
};

export type CompanyUpdateInput = {
  name?: string;
  phone?: string | null;
  foundedAt?: string | null;
  addressRoad?: string | null;
  addressDetail?: string | null;
  visionMission?: string | null;
  companyCodeActive?: boolean;
};

export async function getCompanyInfo(
  actorEmployeeId: string,
): Promise<Result<CompanyInfo>> {
  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const company = await prisma.company.findUnique({
    where: { id: emp.companyId },
    select: {
      id: true,
      name: true,
      businessNumber: true,
      corporateNumber: true,
      phone: true,
      foundedAt: true,
      addressRoad: true,
      addressDetail: true,
      logoUrl: true,
      coverUrl: true,
      companyCode: true,
      companyCodeActive: true,
      visionMission: true,
    },
  });
  if (!company) return err(errors.notFound("회사 정보를 찾을 수 없어요"));

  return ok(company);
}

export async function updateCompanyInfo(
  actorEmployeeId: string,
  input: CompanyUpdateInput,
): Promise<Result<void>> {
  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  await prisma.company.update({
    where: { id: emp.companyId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.foundedAt !== undefined && {
        foundedAt: input.foundedAt ? new Date(input.foundedAt) : null,
      }),
      ...(input.addressRoad !== undefined && { addressRoad: input.addressRoad }),
      ...(input.addressDetail !== undefined && { addressDetail: input.addressDetail }),
      ...(input.visionMission !== undefined && { visionMission: input.visionMission }),
      ...(input.companyCodeActive !== undefined && { companyCodeActive: input.companyCodeActive }),
    },
  });

  return ok(undefined);
}
