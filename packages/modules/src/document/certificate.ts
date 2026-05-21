import { prisma } from "@teamlet/db";
import { ok, err, errors } from "@teamlet/shared";
import type { Result } from "@teamlet/shared";
import type { CertificateIssueItem, CertificateDetail, IssueCertificateInput } from "./types";

function generateIssueNumber(type: string): string {
  const prefix = type === "EMPLOYMENT" ? "EMP" : "CAR";
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${ymd}-${rand}`;
}

export async function listMyCertificates(employeeId: string): Promise<Result<CertificateIssueItem[]>> {
  const issues = await prisma.certificateIssue.findMany({
    where: { employeeId },
    select: {
      id: true, type: true, issueNumber: true, purpose: true, createdAt: true,
      employee: { select: { name: true } },
      issuer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(issues.map((i) => ({
    id: i.id, type: i.type, issueNumber: i.issueNumber, purpose: i.purpose,
    createdAt: i.createdAt, employeeName: i.employee.name, issuerName: i.issuer.name,
  })));
}

export async function getCertificate(employeeId: string, issueId: string): Promise<Result<CertificateDetail>> {
  const issue = await prisma.certificateIssue.findUnique({
    where: { id: issueId },
    select: {
      id: true, type: true, issueNumber: true, purpose: true, createdAt: true,
      snapshotData: true,
      employee: { select: { name: true, id: true } },
      issuer: { select: { name: true } },
    },
  });

  if (!issue) return err(errors.notFound("증명서를 찾을 수 없어요"));
  if (issue.employee.id !== employeeId) return err(errors.forbidden("본인 증명서만 조회할 수 있어요"));

  return ok({
    id: issue.id, type: issue.type, issueNumber: issue.issueNumber, purpose: issue.purpose,
    createdAt: issue.createdAt, employeeName: issue.employee.name, issuerName: issue.issuer.name,
    snapshotData: issue.snapshotData as Record<string, unknown>,
  });
}

export async function issueCertificate(
  issuerId: string,
  input: IssueCertificateInput,
): Promise<Result<{ id: string; issueNumber: string }>> {
  const issuer = await prisma.employee.findUnique({ where: { id: issuerId }, select: { companyId: true, name: true } });
  if (!issuer) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const target = await prisma.employee.findUnique({
    where: { id: input.employeeId },
    select: {
      companyId: true, name: true, hireDate: true, isActive: true,
      departmentId: true, positionId: true,
    },
  });
  if (!target) return err(errors.notFound("대상 직원을 찾을 수 없어요"));
  if (target.companyId !== issuer.companyId) return err(errors.forbidden("같은 회사 직원만 발급할 수 있어요"));

  if (!input.purpose.trim()) return err(errors.validation("발급 목적을 입력해주세요"));

  const [dept, pos] = await Promise.all([
    target.departmentId ? prisma.department.findUnique({ where: { id: target.departmentId }, select: { name: true } }) : null,
    target.positionId ? prisma.position.findUnique({ where: { id: target.positionId }, select: { name: true } }) : null,
  ]);

  const issueNumber = generateIssueNumber(input.type);
  const snapshotData = {
    name: target.name,
    departmentName: dept?.name ?? null,
    positionName: pos?.name ?? null,
    hiredAt: target.hireDate?.toISOString() ?? null,
    isActive: target.isActive,
    issuedAt: new Date().toISOString(),
  };

  const issue = await prisma.certificateIssue.create({
    data: {
      employeeId: input.employeeId,
      issuerId,
      type: input.type,
      issueNumber,
      purpose: input.purpose.trim(),
      snapshotData,
    },
    select: { id: true, issueNumber: true },
  });

  return ok({ id: issue.id, issueNumber: issue.issueNumber });
}
