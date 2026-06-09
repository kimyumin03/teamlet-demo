import { prisma } from "@teamlet/db";
import { ok, err, errors } from "@teamlet/shared";
import type { Result } from "@teamlet/shared";
import { recordAudit } from "../audit/index";
import { catchDomainErr, loadActor } from "../permission/_actor";
import { assertPermission } from "../permission/assert";
import type { CertificateIssueItem, CertificateDetail, IssueCertificateInput, CertificateTemplateItem, CreateCertificateTemplateInput } from "./types";

const CERTIFICATE_MANAGE = "document.certificate.manage";

function generateIssueNumber(type: string): string {
  const prefix = type === "EMPLOYMENT" ? "EMP" : "CAR";
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${ymd}-${rand}`;
}

// ── 템플릿 관리 (관리자 전용) ────────────────────────────────────────────

/** 회사에 등록된 증명서 종류 목록 — 모든 직원 열람 가능 (발급 선택용) */
export async function listCertificateTemplates(
  employeeId: string,
): Promise<Result<CertificateTemplateItem[]>> {
  const actor = await loadActor(employeeId);
  if (!actor) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const templates = await prisma.certificateTemplate.findMany({
    where: { companyId: actor.companyId, isActive: true },
    select: { id: true, name: true, certType: true, fileUrl: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return ok(templates.map((t) => ({ id: t.id, name: t.name, certType: t.certType, fileUrl: t.fileUrl })));
}

/** 증명서 종류 등록 — document.certificate.manage 필요 */
export async function createCertificateTemplate(
  actorId: string,
  input: CreateCertificateTemplateInput,
): Promise<Result<CertificateTemplateItem>> {
  const actor = await loadActor(actorId);
  if (!actor) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  try {
    await assertPermission(actorId, CERTIFICATE_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  if (!input.name.trim()) return err(errors.validation("종류 이름을 입력해주세요"));

  if (!input.fileUrl.trim()) return err(errors.validation("파일 URL을 입력해주세요"));

  const t = await prisma.certificateTemplate.create({
    data: { companyId: actor.companyId, name: input.name.trim(), certType: input.certType, fileUrl: input.fileUrl.trim() },
    select: { id: true, name: true, certType: true, fileUrl: true },
  });

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "document",
    eventType: "CREATE",
    targetType: "CertificateTemplate",
    targetId: t.id,
    targetLabel: t.name,
    description: `증명서 종류 등록: ${t.name}`,
  });

  return ok({ id: t.id, name: t.name, certType: t.certType, fileUrl: t.fileUrl });
}

/** 증명서 종류 삭제(비활성화) — document.certificate.manage 필요 */
export async function deleteCertificateTemplate(
  actorId: string,
  templateId: string,
): Promise<Result<void>> {
  try {
    await assertPermission(actorId, CERTIFICATE_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorId);
  if (!actor) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const template = await prisma.certificateTemplate.findUnique({
    where: { id: templateId },
    select: { companyId: true, name: true },
  });
  if (!template || template.companyId !== actor.companyId)
    return err(errors.notFound("증명서 종류를 찾을 수 없어요"));

  await prisma.certificateTemplate.update({
    where: { id: templateId },
    data: { isActive: false },
  });

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "document",
    eventType: "DELETE",
    targetType: "CertificateTemplate",
    targetId: templateId,
    targetLabel: template.name,
    description: `증명서 종류 삭제: ${template.name}`,
  });

  return ok(undefined);
}

// ── 발급 이력 ────────────────────────────────────────────────────────────

export async function listMyCertificates(employeeId: string): Promise<Result<CertificateIssueItem[]>> {
  const issues = await prisma.certificateIssue.findMany({
    where: { employeeId },
    select: {
      id: true, type: true, issueNumber: true, purpose: true, createdAt: true, fileUrl: true,
      employee: { select: { name: true } },
      issuer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(issues.map((i) => ({
    id: i.id, type: i.type, issueNumber: i.issueNumber, purpose: i.purpose,
    createdAt: i.createdAt, employeeName: i.employee.name, issuerName: i.issuer.name,
    fileUrl: i.fileUrl,
  })));
}

export async function getCertificate(employeeId: string, issueId: string): Promise<Result<CertificateDetail>> {
  const issue = await prisma.certificateIssue.findUnique({
    where: { id: issueId },
    select: {
      id: true, type: true, issueNumber: true, purpose: true, createdAt: true,
      snapshotData: true, fileUrl: true,
      employee: { select: { name: true, id: true } },
      issuer: { select: { name: true, id: true } },
    },
  });

  if (!issue) return err(errors.notFound("증명서를 찾을 수 없어요"));
  // 대상자 본인 또는 발급자(관리자) 조회 허용
  const isTarget = issue.employee.id === employeeId;
  const isIssuer = issue.issuer.id === employeeId;
  if (!isTarget && !isIssuer) return err(errors.forbidden("본인 증명서 또는 직접 발급한 증명서만 조회할 수 있어요"));

  return ok({
    id: issue.id, type: issue.type, issueNumber: issue.issueNumber, purpose: issue.purpose,
    createdAt: issue.createdAt, employeeName: issue.employee.name, issuerName: issue.issuer.name,
    fileUrl: issue.fileUrl,
    snapshotData: issue.snapshotData as Record<string, unknown>,
  });
}

// ── 발급 ────────────────────────────────────────────────────────────────

export async function issueCertificate(
  issuerId: string,
  input: IssueCertificateInput,
): Promise<Result<{ id: string; issueNumber: string; fileUrl: string }>> {
  // 본인 발급 = 권한 불필요 / 타인 발급 = document.certificate.manage 필요
  const isSelf = input.employeeId === issuerId;
  if (!isSelf) {
    try {
      await assertPermission(issuerId, CERTIFICATE_MANAGE);
    } catch (e) {
      return catchDomainErr(e);
    }
  }

  const issuer = await prisma.employee.findUnique({
    where: { id: issuerId },
    select: { companyId: true, name: true, membership: { select: { userId: true } } },
  });
  if (!issuer) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  // 템플릿 조회 — 같은 회사 소속 + 활성 상태 검증
  const template = await prisma.certificateTemplate.findUnique({
    where: { id: input.templateId },
    select: { companyId: true, certType: true, name: true, isActive: true, fileUrl: true },
  });
  if (!template || !template.isActive || template.companyId !== issuer.companyId)
    return err(errors.notFound("등록된 증명서 종류를 찾을 수 없어요. 관리자에게 문의하세요."));

  const target = await prisma.employee.findUnique({
    where: { id: input.employeeId },
    select: { companyId: true, name: true, hireDate: true, isActive: true, departmentId: true, positionId: true },
  });
  if (!target) return err(errors.notFound("대상 직원을 찾을 수 없어요"));
  if (target.companyId !== issuer.companyId) return err(errors.forbidden("같은 회사 직원만 발급할 수 있어요"));

  if (!input.purpose.trim()) return err(errors.validation("발급 목적을 입력해주세요"));

  const [dept, pos] = await Promise.all([
    target.departmentId ? prisma.department.findUnique({ where: { id: target.departmentId }, select: { name: true } }) : null,
    target.positionId ? prisma.position.findUnique({ where: { id: target.positionId }, select: { name: true } }) : null,
  ]);

  const issueNumber = generateIssueNumber(template.certType);
  const snapshotData = {
    name: target.name,
    departmentName: dept?.name ?? null,
    positionName: pos?.name ?? null,
    hiredAt: target.hireDate?.toISOString() ?? null,
    isActive: target.isActive,
    issuedAt: new Date().toISOString(),
    templateName: template.name,
  };

  const issue = await prisma.certificateIssue.create({
    data: {
      employeeId: input.employeeId,
      issuerId,
      type: template.certType,
      issueNumber,
      purpose: input.purpose.trim(),
      snapshotData,
      fileUrl: template.fileUrl,
    },
    select: { id: true, issueNumber: true },
  });

  await recordAudit({
    companyId: issuer.companyId,
    actorUserId: issuer.membership?.userId ?? null,
    activityType: "document",
    eventType: "CREATE",
    targetType: "CertificateIssue",
    targetId: issue.id,
    targetLabel: `${target.name} · ${template.name}`,
    description: `증명서 발급: ${template.name} → ${target.name} (${issueNumber})`,
  });

  return ok({ id: issue.id, issueNumber: issue.issueNumber, fileUrl: template.fileUrl });
}
