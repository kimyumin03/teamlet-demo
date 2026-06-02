import { prisma } from "@teamlet/db";
import type { LeavePromotionType } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { catchDomainErr } from "../permission/_actor";
import { assertPermission } from "../permission/assert";
import { createNotification } from "../notification/index";
import type { LeavePromotionItem, MyLeavePromotionItem, LeavePromotionDetail, LeavePlanActivityLog } from "./types";

const BALANCE_MANAGE = "leave.balance.manage";

const PROMOTION_TYPE_KO: Record<LeavePromotionType, string> = {
  ANNUAL: "연차",
  MONTHLY_1ST: "월차 1차",
  MONTHLY_2ND: "월차 2차",
};

export async function listCompanyLeavePromotions(
  actorEmployeeId: string,
  year?: number,
): Promise<Result<LeavePromotionItem[]>> {
  try {
    await assertPermission(actorEmployeeId, BALANCE_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const targetYear = year ?? new Date().getFullYear();

  const promotions = await prisma.leavePromotion.findMany({
    where: {
      employee: { companyId: emp.companyId },
      year: targetYear,
    },
    include: {
      employee: {
        select: {
          name: true,
          employeeNumber: true,
          employmentStatus: true,
          department: { select: { name: true } },
        },
      },
      planDates: { select: { planDate: true }, orderBy: { planDate: "asc" } },
    },
    orderBy: [{ expiryDate: "asc" }, { employee: { name: "asc" } }],
  });

  return ok(
    promotions.map((p) => ({
      id: p.id,
      employeeId: p.employeeId,
      employeeName: p.employee.name,
      employeeNumber: p.employee.employeeNumber,
      departmentName: p.employee.department?.name ?? null,
      employmentStatus: p.employee.employmentStatus,
      year: p.year,
      promotionType: p.promotionType,
      targetDays: Number(p.targetDays),
      expiryDate: p.expiryDate,
      status: p.status,
      requestedAt: p.requestedAt,
      submittedAt: p.submittedAt,
      approvedAt: p.approvedAt,
      planDates: p.planDates.map((d) => d.planDate),
      formDocumentId: p.formDocumentId,
    })),
  );
}

export async function cancelLeavePromotion(
  actorEmployeeId: string,
  promotionId: string,
): Promise<Result<void>> {
  try {
    await assertPermission(actorEmployeeId, BALANCE_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const emp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const promotion = await prisma.leavePromotion.findFirst({
    where: { id: promotionId, employee: { companyId: emp.companyId } },
  });
  if (!promotion) return err(errors.notFound("촉진 내역을 찾을 수 없어요"));

  if (promotion.status === "CANCELLED" || promotion.status === "COMPLETED") {
    return err(errors.forbidden("이미 종료된 촉진이에요"));
  }

  await prisma.leavePromotion.update({
    where: { id: promotionId },
    data: { status: "CANCELLED" },
  });
  return ok(undefined);
}

/* ──────────────────────────────────────────────
   구성원 — 연차 사용 계획 (촉진 응답)
────────────────────────────────────────────── */

/** 내 휴가 > 연차 사용 계획 탭 — 본인에게 발송된 촉진 목록 */
export async function getMyLeavePromotions(
  employeeId: string,
  year?: number,
): Promise<Result<MyLeavePromotionItem[]>> {
  const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true } });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const targetYear = year ?? new Date().getFullYear();
  const promos = await prisma.leavePromotion.findMany({
    where: { employeeId, year: targetYear },
    include: { planDates: { select: { planDate: true }, orderBy: { planDate: "asc" } } },
    orderBy: { expiryDate: "asc" },
  });

  return ok(
    promos.map((p) => ({
      id: p.id,
      year: p.year,
      promotionType: p.promotionType,
      targetDays: Number(p.targetDays),
      expiryDate: p.expiryDate,
      status: p.status,
      requestedAt: p.requestedAt,
      submittedAt: p.submittedAt,
      planDates: p.planDates.map((d) => d.planDate),
      formDocumentId: p.formDocumentId,
      canSubmit: p.status === "REQUESTED" || p.status === "ADMIN_WRITING",
    })),
  );
}

/**
 * 연차 사용 계획 제출 — 사용 희망일 N개 선택 → FormDocument(LEAVE_PLAN) 결재 생성.
 * 촉진 설정(CompanyLeaveSettings.promotionApproverEmployeeId)의 승인선을 적용.
 * 근로기준법 제61조 — 전자결재로 사용 시기 지정·통보의 법적 효력 충족.
 */
export async function submitLeavePlan(
  employeeId: string,
  promotionId: string,
  planDates: Date[],
): Promise<Result<{ id: string }>> {
  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true, name: true },
  });
  if (!emp) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const promo = await prisma.leavePromotion.findFirst({
    where: { id: promotionId, employeeId },
  });
  if (!promo) return err(errors.notFound("촉진 내역을 찾을 수 없어요"));
  if (promo.status !== "REQUESTED" && promo.status !== "ADMIN_WRITING") {
    return err(errors.forbidden("지금은 사용 계획을 제출할 수 없어요"));
  }
  if (planDates.length === 0) {
    return err(errors.validation("사용 희망일을 1개 이상 선택해 주세요"));
  }

  // 회사 촉진 설정의 승인 담당자
  const settings = await prisma.companyLeaveSettings.findUnique({
    where: { companyId: emp.companyId },
    select: { promotionApproverEmployeeId: true, promotionCcEmployeeIds: true },
  });
  const approverId = settings?.promotionApproverEmployeeId ?? null;
  const needsApproval = !!approverId && approverId !== employeeId;

  const title = `연차 사용 계획 — ${PROMOTION_TYPE_KO[promo.promotionType]} (${planDates.length}일)`;
  const planDateStrs = planDates.map((d) => d.toISOString().slice(0, 10));

  const created = await prisma.$transaction(async (tx) => {
    // 기존 희망일 교체 (재제출 대비)
    await tx.leavePromotionPlanDate.deleteMany({ where: { promotionId } });
    await tx.leavePromotionPlanDate.createMany({
      data: planDates.map((d) => ({ promotionId, planDate: d })),
    });

    const doc = await tx.formDocument.create({
      data: {
        companyId: emp.companyId,
        authorId: employeeId,
        title,
        kind: "LEAVE_PLAN",
        formData: {
          promotionId,
          promotionType: promo.promotionType,
          planDates: planDateStrs,
        },
        status: needsApproval ? "IN_PROGRESS" : "APPROVED",
      },
      select: { id: true },
    });
    if (needsApproval) {
      await tx.approvalLine.create({
        data: { documentId: doc.id, step: 1, approverId: approverId!, status: "PENDING" },
      });
    }
    await tx.leavePromotion.update({
      where: { id: promotionId },
      data: {
        status: needsApproval ? "APPROVAL_PENDING" : "COMPLETED",
        submittedAt: new Date(),
        ...(needsApproval ? {} : { approvedAt: new Date() }),
        formDocumentId: doc.id,
      },
    });
    return { docId: doc.id };
  });

  // 승인 담당자 알림 (트랜잭션 밖)
  if (needsApproval && approverId) {
    await createNotification({
      companyId: emp.companyId,
      recipientEmployeeId: approverId,
      category: "APPROVAL",
      eventKey: `leave_plan:${promotionId}`,
      title: "연차 사용 계획 승인 요청",
      body: `${emp.name}님이 연차 사용 계획을 제출했어요.`,
      deepLink: `/workflow/documents/${created.docId}`,
      relatedTargetType: "LeavePromotion",
      relatedTargetId: promotionId,
    }).catch(() => { /* 알림 실패 무시 */ });
  }

  return ok({ id: created.docId });
}

/**
 * 연차 사용 계획 상세 (관리자 사이드 패널 / 본인 조회) — teamlet[28] verbatim.
 * 본인이 아니면 leave.balance.manage 권한 필요.
 */
export async function getLeavePromotionDetail(
  actorEmployeeId: string,
  promotionId: string,
): Promise<Result<LeavePromotionDetail>> {
  const actor = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const promo = await prisma.leavePromotion.findFirst({
    where: { id: promotionId, employee: { companyId: actor.companyId } },
    include: {
      employee: { select: { id: true, name: true, employeeNumber: true } },
      planDates: { select: { planDate: true }, orderBy: { planDate: "asc" } },
      formDocument: {
        include: {
          approvalLines: {
            include: { approver: { select: { name: true } } },
            orderBy: { step: "asc" },
          },
        },
      },
    },
  });
  if (!promo) return err(errors.notFound("촉진 내역을 찾을 수 없어요"));

  // 본인이 아니면 관리 권한 필요
  if (promo.employee.id !== actorEmployeeId) {
    try {
      await assertPermission(actorEmployeeId, BALANCE_MANAGE);
    } catch (e) {
      return catchDomainErr(e);
    }
  }

  // 활동 로그 (teamlet[28]: "OOO님이 연차 사용 계획을 작성했어요" / "OOO님이 승인했어요")
  const activityLog: LeavePlanActivityLog[] = [];
  activityLog.push({ actorName: "담당자", message: "연차 촉진을 시작했어요.", at: promo.requestedAt });
  if (promo.submittedAt) {
    activityLog.push({ actorName: promo.employee.name, message: "연차 사용 계획을 작성했어요.", at: promo.submittedAt });
  }
  const approval = (promo.formDocument?.approvalLines ?? []).map((l) => ({
    step: l.step,
    approverName: l.approver.name,
    status: l.status,
  }));
  if (promo.approvedAt) {
    const approverName = promo.formDocument?.approvalLines[0]?.approver.name ?? "승인자";
    activityLog.push({ actorName: approverName, message: "승인했어요.", at: promo.approvedAt });
  }

  return ok({
    id: promo.id,
    employeeName: promo.employee.name,
    employeeNumber: promo.employee.employeeNumber,
    year: promo.year,
    promotionType: promo.promotionType,
    targetDays: Number(promo.targetDays),
    expiryDate: promo.expiryDate,
    status: promo.status,
    requestedAt: promo.requestedAt,
    submittedAt: promo.submittedAt,
    approvedAt: promo.approvedAt,
    planDates: promo.planDates.map((d) => d.planDate),
    formDocumentId: promo.formDocumentId,
    activityLog,
    approval,
  });
}

/**
 * LEAVE_PLAN 문서 최종 처리 — 워크플로우 approveDocument/rejectDocument 가 호출.
 * 승인 → 촉진 COMPLETED, 반려 → REJECTED. (finalizeLeaveFrom* 와 동일 패턴 — 트랜잭션 밖)
 */
export async function finalizeLeavePlanFromDocument(
  documentId: string,
  approved: boolean,
): Promise<void> {
  const promo = await prisma.leavePromotion.findUnique({
    where: { formDocumentId: documentId },
    select: { id: true, status: true },
  });
  if (!promo) return;
  if (promo.status !== "APPROVAL_PENDING") return; // 멱등 — 이미 처리됨

  await prisma.leavePromotion.update({
    where: { id: promo.id },
    data: approved
      ? { status: "COMPLETED", approvedAt: new Date() }
      : { status: "REJECTED" },
  });
}
