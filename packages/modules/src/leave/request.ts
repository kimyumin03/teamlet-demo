import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { catchDomainErr, loadActor } from "../permission/_actor";
import { assertPermission } from "../permission/assert";
import { getEffectivePermissions } from "../permission/effective";
import { createNotification } from "../notification/index";
import type { RequestLeaveInput, LeaveRequestItem, PendingLeaveRequestItem, CompanyLeaveRequestItem } from "./types";

const BALANCE_READ = "leave.balance.read";
const BALANCE_MANAGE = "leave.balance.manage";

export async function listPendingLeaveRequests(
  actorEmployeeId: string,
): Promise<Result<PendingLeaveRequestItem[]>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  // 휴가 승인 권한 + scope 확인 (DEPARTMENT scope는 해당 부서 신청만)
  const perms = await getEffectivePermissions(actorEmployeeId);
  const perm = perms.get(BALANCE_MANAGE);
  if (!perm) return err(errors.forbidden("휴가 신청 목록을 볼 권한이 없어요"));

  const scopedDeptIds =
    perm.scopeType === "DEPARTMENT" && perm.departmentIds.length > 0
      ? perm.departmentIds
      : null;

  const requests = await prisma.leaveRequest.findMany({
    where: {
      employee: {
        companyId: actor.companyId,
        ...(scopedDeptIds ? { departmentId: { in: scopedDeptIds } } : {}),
      },
      status: "PENDING",
      formDocumentId: null,
    },
    include: {
      employee: { select: { name: true } },
      leaveType: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return ok(
    requests.map((r) => ({
      id: r.id,
      employeeName: r.employee.name,
      leaveTypeName: r.leaveType.name,
      startDate: r.startDate,
      endDate: r.endDate,
      days: Number(r.days),
      reason: r.reason,
      createdAt: r.createdAt,
    })),
  );
}

export async function listMyLeaveRequests(
  employeeId: string,
): Promise<Result<LeaveRequestItem[]>> {
  const requests = await prisma.leaveRequest.findMany({
    where: { employeeId },
    include: { leaveType: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return ok(
    requests.map((r) => ({
      id: r.id,
      leaveTypeName: r.leaveType.name,
      startDate: r.startDate,
      endDate: r.endDate,
      days: Number(r.days),
      reason: r.reason,
      status: r.status,
      reviewNote: r.reviewNote,
      createdAt: r.createdAt,
    })),
  );
}

/** HR이 특정 직원의 휴가 신청 이력 조회 (같은 회사 내 directory.read 권한 필요). */
export async function listEmployeeLeaveHistory(
  actorEmployeeId: string,
  targetEmployeeId: string,
): Promise<Result<LeaveRequestItem[]>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const target = await prisma.employee.findUnique({
    where: { id: targetEmployeeId },
    select: { companyId: true, departmentId: true },
  });
  if (!target || target.companyId !== actor.companyId) {
    return err(errors.notFound("직원을 찾을 수 없어요"));
  }

  // 본인 이력은 권한 없이, 타인 이력은 leave.balance.read 권한 필요
  if (targetEmployeeId !== actorEmployeeId) {
    try {
      await assertPermission(actorEmployeeId, BALANCE_READ, {
        targetEmployeeId,
        targetDepartmentId: target.departmentId ?? undefined,
      });
    } catch (e) {
      return catchDomainErr(e);
    }
  }

  const requests = await prisma.leaveRequest.findMany({
    where: { employeeId: targetEmployeeId },
    include: { leaveType: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return ok(
    requests.map((r) => ({
      id: r.id,
      leaveTypeName: r.leaveType.name,
      startDate: r.startDate,
      endDate: r.endDate,
      days: Number(r.days),
      reason: r.reason,
      status: r.status,
      reviewNote: r.reviewNote,
      createdAt: r.createdAt,
    })),
  );
}

export async function requestLeave(
  input: RequestLeaveInput,
): Promise<Result<{ id: string }>> {
  const { employeeId, leaveTypeId, approverId, startDate, endDate, days, reason, evidenceFileUrl } =
    input;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true },
  });
  if (!employee) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const leaveType = await prisma.leaveType.findUnique({
    where: { id: leaveTypeId },
    select: { isActive: true, name: true, companyId: true },
  });
  if (!leaveType?.isActive || leaveType.companyId !== employee.companyId) {
    return err(errors.validation("비활성 휴가 종류예요"));
  }

  const needsApproval = !!approverId;
  if (needsApproval) {
    if (approverId === employeeId) {
      return err(errors.validation("본인을 결재자로 지정할 수 없어요"));
    }
    const approver = await prisma.employee.findUnique({
      where: { id: approverId },
      select: { companyId: true, isActive: true },
    });
    if (!approver || approver.companyId !== employee.companyId) {
      return err(errors.notFound("결재자를 찾을 수 없어요"));
    }
    if (!approver.isActive) {
      return err(errors.validation("비활성 구성원은 결재자로 지정할 수 없어요"));
    }
  }

  const year = startDate.getFullYear();
  const balance = await prisma.leaveBalance.findUnique({
    where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
    select: { grantedDays: true, usedDays: true, adjustedDays: true },
  });

  // 승인 대기 중인 신청도 잔여에서 차감 — 중복 초과 신청 방지
  const pendingAgg = await prisma.leaveRequest.aggregate({
    where: {
      employeeId,
      leaveTypeId,
      status: "PENDING",
      startDate: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) },
    },
    _sum: { days: true },
  });
  const pendingDays = Number(pendingAgg._sum.days ?? 0);

  const remaining = balance
    ? Number(balance.grantedDays) - Number(balance.usedDays) - pendingDays + Number(balance.adjustedDays)
    : -pendingDays;

  if (remaining < days)
    return err(errors.validation(`잔여 휴가가 부족해요 (잔여 ${remaining}일, 신청 ${days}일)`));

  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);
  const title = `휴가 신청 — ${leaveType.name} ${startStr}~${endStr} (${days}일)`;

  // 휴가 신청 = FormDocument(LEAVE_REQUEST) + 결재선 — 통합 결재 인프라 경유.
  // 최종 승인/반려는 워크플로우 approveDocument/rejectDocument 가 finalize 를 호출.
  const created = await prisma.$transaction(async (tx) => {
    const docStatus = needsApproval ? "IN_PROGRESS" : "APPROVED";
    const doc = await tx.formDocument.create({
      data: {
        companyId: employee.companyId,
        authorId: employeeId,
        title,
        kind: "LEAVE_REQUEST",
        formData: {
          leaveTypeId,
          leaveTypeName: leaveType.name,
          startDate: startStr,
          endDate: endStr,
          days,
          reason: reason ?? "",
          ...(evidenceFileUrl && { evidenceFileUrl }),
        },
        status: docStatus,
      },
      select: { id: true },
    });
    if (needsApproval) {
      await tx.approvalLine.create({
        data: { documentId: doc.id, step: 1, approverId: approverId!, status: "PENDING" },
      });
    }
    const leaveStatus = needsApproval ? "PENDING" : "APPROVED";
    const req = await tx.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId,
        startDate,
        endDate,
        days,
        reason: reason ?? "",
        status: leaveStatus,
        formDocumentId: doc.id,
        ...(evidenceFileUrl && { evidenceFileUrl }),
      },
      select: { id: true },
    });
    // 승인자 없으면 즉시 잔여 차감 + 원장 기록
    if (!needsApproval) {
      const yr = startDate.getFullYear();
      await tx.leaveTransaction.create({
        data: {
          employeeId, leaveTypeId,
          category: "ANNUAL",
          txType: "USE",
          days,
          reason: reason ?? "휴가 사용 (자동 승인)",
          actorId: employeeId,
        },
      });
      await tx.leaveBalance.upsert({
        where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year: yr } },
        create: { employeeId, leaveTypeId, year: yr, grantedDays: 0, usedDays: days },
        update: { usedDays: { increment: days } },
      });
    }
    return { reqId: req.id, docId: doc.id };
  });

  // 승인자에게 결재 요청 알림 (트랜잭션 밖 — 알림 실패가 신청을 취소시키지 않음)
  if (needsApproval && approverId) {
    const submitter = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { name: true, companyId: true },
    });
    if (submitter) {
      await createNotification({
        companyId: submitter.companyId,
        recipientEmployeeId: approverId,
        category: "APPROVAL",
        eventKey: `leave_request:${created.reqId}`,
        title: "휴가 결재 요청",
        body: `${submitter.name}님이 ${leaveType.name} 결재를 요청했어요.`,
        deepLink: `/workflow/documents/${created.docId}`,
        relatedTargetType: "LeaveRequest",
        relatedTargetId: created.reqId,
      }).catch(() => { /* 알림 실패 무시 */ });
    }
  }

  return ok({ id: created.reqId });
}

/**
 * 휴가 결재 문서가 최종 승인됐을 때 휴가 효과 적용 — 워크플로우 approveDocument 가 호출.
 * 멱등 — LeaveRequest 가 PENDING 일 때만 동작.
 */
export async function finalizeLeaveFromApprovedDocument(
  documentId: string,
): Promise<void> {
  const req = await prisma.leaveRequest.findUnique({
    where: { formDocumentId: documentId },
    select: {
      id: true,
      employeeId: true,
      leaveTypeId: true,
      days: true,
      status: true,
      startDate: true,
    },
  });
  if (!req || req.status !== "PENDING") return;

  const year = req.startDate.getFullYear();
  await prisma.$transaction([
    prisma.leaveRequest.update({
      where: { id: req.id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    }),
    prisma.leaveTransaction.create({
      data: {
        employeeId: req.employeeId,
        leaveTypeId: req.leaveTypeId,
        category: "ANNUAL",
        txType: "USE",
        days: -Number(req.days),
        reason: "휴가 사용",
        leaveRequestId: req.id,
      },
    }),
    prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: req.employeeId,
          leaveTypeId: req.leaveTypeId,
          year,
        },
      },
      create: {
        employeeId: req.employeeId,
        leaveTypeId: req.leaveTypeId,
        year,
        usedDays: Number(req.days),
      },
      update: { usedDays: { increment: Number(req.days) } },
    }),
  ]);
}

/**
 * 휴가 결재 문서가 반려됐을 때 휴가 신청 상태 반영 — 워크플로우 rejectDocument 가 호출.
 * 멱등 — LeaveRequest 가 PENDING 일 때만 동작.
 */
export async function finalizeLeaveFromRejectedDocument(
  documentId: string,
): Promise<void> {
  const req = await prisma.leaveRequest.findUnique({
    where: { formDocumentId: documentId },
    select: { id: true, status: true },
  });
  if (!req || req.status !== "PENDING") return;

  await prisma.leaveRequest.update({
    where: { id: req.id },
    data: { status: "REJECTED", reviewedAt: new Date() },
  });
}

export async function approveLeave(
  actorId: string,
  requestId: string,
): Promise<Result<void>> {
  const req = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      employeeId: true,
      leaveTypeId: true,
      days: true,
      status: true,
      startDate: true,
      formDocumentId: true,
      employee: { select: { departmentId: true } },
    },
  });
  if (!req) return err(errors.notFound("휴가 신청을 찾을 수 없어요"));
  if (req.formDocumentId)
    return err(errors.validation("이 휴가 신청은 결재함에서 처리해 주세요"));
  if (req.status !== "PENDING") return err(errors.validation("대기 중인 신청만 승인할 수 있어요"));

  try {
    await assertPermission(actorId, BALANCE_MANAGE, {
      targetEmployeeId: req.employeeId,
      targetDepartmentId: req.employee.departmentId ?? undefined,
    });
  } catch (e) {
    return catchDomainErr(e);
  }

  const year = req.startDate.getFullYear();

  await prisma.$transaction([
    prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", reviewedAt: new Date(), reviewedBy: actorId },
    }),
    prisma.leaveTransaction.create({
      data: {
        employeeId: req.employeeId,
        leaveTypeId: req.leaveTypeId,
        category: "ANNUAL",
        txType: "USE",
        days: -Number(req.days),
        reason: "휴가 사용",
        actorId,
        leaveRequestId: requestId,
      },
    }),
    prisma.leaveBalance.upsert({
      where: { employeeId_leaveTypeId_year: { employeeId: req.employeeId, leaveTypeId: req.leaveTypeId, year } },
      create: { employeeId: req.employeeId, leaveTypeId: req.leaveTypeId, year, usedDays: Number(req.days) },
      update: { usedDays: { increment: Number(req.days) } },
    }),
  ]);

  return ok(undefined);
}

export async function rejectLeave(
  actorId: string,
  requestId: string,
  reviewNote?: string,
): Promise<Result<void>> {
  const req = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    select: {
      status: true,
      employeeId: true,
      formDocumentId: true,
      employee: { select: { departmentId: true } },
    },
  });
  if (!req) return err(errors.notFound("휴가 신청을 찾을 수 없어요"));
  if (req.formDocumentId)
    return err(errors.validation("이 휴가 신청은 결재함에서 처리해 주세요"));
  if (req.status !== "PENDING") return err(errors.validation("대기 중인 신청만 반려할 수 있어요"));

  try {
    await assertPermission(actorId, BALANCE_MANAGE, {
      targetEmployeeId: req.employeeId,
      targetDepartmentId: req.employee.departmentId ?? undefined,
    });
  } catch (e) {
    return catchDomainErr(e);
  }

  await prisma.leaveRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", reviewedAt: new Date(), reviewedBy: actorId, reviewNote },
  });

  return ok(undefined);
}

export async function listCompanyLeaveRequests(
  actorEmployeeId: string,
): Promise<Result<CompanyLeaveRequestItem[]>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const perms = await getEffectivePermissions(actorEmployeeId);
  const perm = perms.get(BALANCE_MANAGE);
  if (!perm) return err(errors.forbidden("휴가 내역을 볼 권한이 없어요"));

  const scopedDeptIds =
    perm.scopeType === "DEPARTMENT" && perm.departmentIds.length > 0
      ? perm.departmentIds
      : null;

  const requests = await prisma.leaveRequest.findMany({
    where: {
      employee: {
        companyId: actor.companyId,
        ...(scopedDeptIds ? { departmentId: { in: scopedDeptIds } } : {}),
      },
    },
    include: {
      employee: { select: { name: true, department: { select: { name: true } } } },
      leaveType: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return ok(
    requests.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employee.name,
      departmentName: r.employee.department?.name ?? null,
      leaveTypeName: r.leaveType.name,
      startDate: r.startDate,
      endDate: r.endDate,
      days: Number(r.days),
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
      formDocumentId: r.formDocumentId ?? null,
    })),
  );
}

export async function cancelLeave(
  requestId: string,
  employeeId: string,
): Promise<Result<void>> {
  const req = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    select: { employeeId: true, leaveTypeId: true, days: true, status: true, startDate: true, formDocumentId: true },
  });
  if (!req) return err(errors.notFound("휴가 신청을 찾을 수 없어요"));
  if (req.employeeId !== employeeId) return err(errors.forbidden("본인 신청만 취소할 수 있어요"));
  if (!["PENDING", "APPROVED"].includes(req.status))
    return err(errors.validation("취소할 수 없는 상태예요"));

  const year = req.startDate.getFullYear();
  const wasApproved = req.status === "APPROVED";

  await prisma.$transaction([
    prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
    }),
    ...(req.formDocumentId
      ? [
          prisma.formDocument.update({ where: { id: req.formDocumentId }, data: { status: "CANCELLED" } }),
          prisma.approvalLine.updateMany({
            where: { documentId: req.formDocumentId, status: "PENDING" },
            data: { status: "REJECTED" },
          }),
        ]
      : []),
    ...(wasApproved
      ? [
          prisma.leaveTransaction.create({
            data: {
              employeeId: req.employeeId,
              leaveTypeId: req.leaveTypeId,
              category: "ANNUAL",
              txType: "ADJUST",
              days: Number(req.days),
              reason: "휴가 취소 복원",
              leaveRequestId: requestId,
            },
          }),
          prisma.leaveBalance.update({
            where: {
              employeeId_leaveTypeId_year: {
                employeeId: req.employeeId,
                leaveTypeId: req.leaveTypeId,
                year,
              },
            },
            data: { usedDays: { decrement: Number(req.days) } },
          }),
        ]
      : []),
  ]);

  return ok(undefined);
}
