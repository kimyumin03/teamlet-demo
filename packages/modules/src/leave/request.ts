import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { catchDomainErr, loadActor } from "../permission/_actor";
import { assertPermission } from "../permission/assert";
import { getEffectivePermissions } from "../permission/effective";
import { createNotification } from "../notification/index";
import type { RequestLeaveInput, LeaveRequestItem, PendingLeaveRequestItem, CompanyLeaveRequestItem, LeaveScheduleEntry } from "./types";

/** Prisma Json → LeaveScheduleEntry[] 안전 캐스팅 */
function parseSchedule(raw: unknown): LeaveScheduleEntry[] {
  return Array.isArray(raw) ? (raw as LeaveScheduleEntry[]) : [];
}

const BALANCE_READ = "leave.balance.read";
const BALANCE_MANAGE = "leave.balance.manage";

/**
 * 사전 부여(잔여를 미리 보유) 휴가 여부.
 *  - 연차: 연차 정책 엔진이 회계일/입사일에 사전 부여
 *  - 입사 시 부여(ON_HIRE) · 근속 시 부여(ON_TENURE) · 관리자 직접 부여(MANUAL): 시점에 사전 부여됨
 * 그 외(ON_REQUEST·ON_OTHER_EXHAUSTED·비연차 PERIODIC 보건/난임)는 "신청 시 부여" —
 * 잔여 부족으로 차단하지 않고 grantAmount 가 있으면 월/연 한도로만 제한한다.
 */
function isPreGranted(key: string, method: string): boolean {
  if (key === "annual") return true;
  return method === "ON_HIRE" || method === "ON_TENURE" || method === "MANUAL";
}

/** 한도 집계 주기가 월 단위인지 — periodicCycle 이 monthly 계열이면 월 한도(보건=월 1일) */
function isMonthlyCap(periodicCycle: string | null): boolean {
  return !!periodicCycle && periodicCycle.startsWith("monthly");
}

/** 트랜잭션 분류 — 연차만 ANNUAL, 그 외(법정·자율 휴가)는 EXTRA_GRANT */
function leaveTxCategory(key: string): "ANNUAL" | "EXTRA_GRANT" {
  return key === "annual" ? "ANNUAL" : "EXTRA_GRANT";
}

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
      unitType: r.unitType,
      schedule: parseSchedule(r.schedule),
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
      unitType: r.unitType,
      schedule: parseSchedule(r.schedule),
    })),
  );
}

export async function requestLeave(
  input: RequestLeaveInput,
): Promise<Result<{ id: string }>> {
  const { employeeId, leaveTypeId, approverId, startDate, endDate, reason, evidenceFileUrl, schedule } =
    input;

  // schedule(날짜별 상세 일정)이 있으면 일수는 합산값을 신뢰 — UI days와 정합성 확보
  const days = schedule && schedule.length > 0
    ? Math.round(schedule.reduce((s, e) => s + e.days, 0) * 100) / 100
    : input.days;
  // 대표 단위 — 단일 schedule이면 그 단위, 혼합이면 MIXED, 없으면 FULL
  const repUnit = schedule && schedule.length > 0
    ? (schedule.every((e) => e.unit === schedule[0]!.unit) ? schedule[0]!.unit : "MIXED")
    : "FULL";
  const repStart = schedule && schedule.length === 1 ? schedule[0]!.startTime : undefined;
  const repEnd = schedule && schedule.length === 1 ? schedule[0]!.endTime : undefined;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true },
  });
  if (!employee) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

  const leaveType = await prisma.leaveType.findUnique({
    where: { id: leaveTypeId },
    select: { isActive: true, name: true, companyId: true, key: true, grantMethod: true, grantAmount: true, periodicCycle: true },
  });
  if (!leaveType?.isActive || leaveType.companyId !== employee.companyId) {
    return err(errors.validation("비활성 휴가 종류예요"));
  }
  const grantsOnRequest = !isPreGranted(leaveType.key, leaveType.grantMethod);
  const txCategory = leaveTxCategory(leaveType.key);

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

  if (grantsOnRequest) {
    // 신청 시 부여 휴가 — 잔여 차단 대신 한도(grantAmount) 검사. 한도 없으면(null) 무제한.
    // 보건(월 1일) 같은 월 단위 휴가는 해당 월, 그 외(난임 연 6일 등)는 해당 연도 기준으로 집계.
    if (leaveType.grantAmount != null) {
      const cap = Number(leaveType.grantAmount);
      const monthly = isMonthlyCap(leaveType.periodicCycle);
      const winStart = monthly
        ? new Date(startDate.getFullYear(), startDate.getMonth(), 1)
        : new Date(`${year}-01-01`);
      const winEnd = monthly
        ? new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1)
        : new Date(`${year + 1}-01-01`);
      const usedAgg = await prisma.leaveRequest.aggregate({
        where: { employeeId, leaveTypeId, status: { in: ["PENDING", "APPROVED"] }, startDate: { gte: winStart, lt: winEnd } },
        _sum: { days: true },
      });
      const usedInWindow = Number(usedAgg._sum.days ?? 0);
      if (usedInWindow + days > cap)
        return err(errors.validation(`${leaveType.name}은(는) ${monthly ? "월" : "연"} ${cap}일까지 사용할 수 있어요 (이미 ${usedInWindow}일 사용·대기 중)`));
    }
  } else if (remaining < days) {
    return err(errors.validation(`잔여 휴가가 부족해요 (잔여 ${remaining}일, 신청 ${days}일)`));
  }

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
        unitType: repUnit,
        ...(repStart && { startTime: repStart }),
        ...(repEnd && { endTime: repEnd }),
        ...(schedule && schedule.length > 0 && { schedule }),
        ...(evidenceFileUrl && { evidenceFileUrl }),
      },
      select: { id: true },
    });
    // 승인자 없으면 즉시 부여(신청 시 부여 휴가)·사용 차감 + 원장 기록
    if (!needsApproval) {
      const yr = startDate.getFullYear();
      // 신청 시 부여 휴가는 사용과 동시에 부여(GRANT +days)
      if (grantsOnRequest) {
        await tx.leaveTransaction.create({
          data: {
            employeeId, leaveTypeId, category: txCategory, txType: "GRANT",
            days, reason: `${leaveType.name} 부여 (신청 시 부여)`, actorId: employeeId,
          },
        });
      }
      // 사용 — USE 는 음수(원장 규약)
      await tx.leaveTransaction.create({
        data: {
          employeeId, leaveTypeId, category: txCategory, txType: "USE",
          days: -days, reason: reason ?? "휴가 사용 (자동 승인)", actorId: employeeId,
        },
      });
      await tx.leaveBalance.upsert({
        where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year: yr } },
        create: { employeeId, leaveTypeId, year: yr, grantedDays: grantsOnRequest ? days : 0, usedDays: days },
        update: { usedDays: { increment: days }, ...(grantsOnRequest && { grantedDays: { increment: days } }) },
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
  // 취소 승인 결재 문서면 원 휴가를 취소 처리 (formData.cancelRequestId)
  const doc = await prisma.formDocument.findUnique({
    where: { id: documentId }, select: { formData: true },
  });
  const cancelReqId = extractCancelRequestId(doc?.formData);
  if (cancelReqId) {
    await finalizeCancelApproved(cancelReqId);
    return;
  }

  const req = await prisma.leaveRequest.findUnique({
    where: { formDocumentId: documentId },
    select: {
      id: true,
      employeeId: true,
      leaveTypeId: true,
      days: true,
      status: true,
      startDate: true,
      leaveType: { select: { name: true, key: true, grantMethod: true } },
    },
  });
  if (!req || req.status !== "PENDING") return;

  const year = req.startDate.getFullYear();
  const days = Number(req.days);
  const grantsOnRequest = !isPreGranted(req.leaveType.key, req.leaveType.grantMethod);
  const txCategory = leaveTxCategory(req.leaveType.key);

  await prisma.$transaction([
    prisma.leaveRequest.update({
      where: { id: req.id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    }),
    // 신청 시 부여 휴가는 승인 시 부여(GRANT +days)도 함께 기록
    ...(grantsOnRequest
      ? [prisma.leaveTransaction.create({
          data: {
            employeeId: req.employeeId, leaveTypeId: req.leaveTypeId,
            category: txCategory, txType: "GRANT" as const, days,
            reason: `${req.leaveType.name} 부여 (신청 시 부여)`, leaveRequestId: req.id,
          },
        })]
      : []),
    prisma.leaveTransaction.create({
      data: {
        employeeId: req.employeeId,
        leaveTypeId: req.leaveTypeId,
        category: txCategory,
        txType: "USE",
        days: -days,
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
        grantedDays: grantsOnRequest ? days : 0,
        usedDays: days,
      },
      update: { usedDays: { increment: days }, ...(grantsOnRequest && { grantedDays: { increment: days } }) },
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
  // 취소 승인 결재가 반려되면 원 휴가는 APPROVED 로 복귀 (휴가를 못 쓰게 되는 상황 방지)
  const doc = await prisma.formDocument.findUnique({
    where: { id: documentId }, select: { formData: true },
  });
  const cancelReqId = extractCancelRequestId(doc?.formData);
  if (cancelReqId) {
    await prisma.leaveRequest.updateMany({
      where: { id: cancelReqId, status: "CANCEL_PENDING" },
      data: { status: "APPROVED" },
    });
    return;
  }

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
      leaveType: { select: { name: true, key: true, grantMethod: true } },
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
  const days = Number(req.days);
  const grantsOnRequest = !isPreGranted(req.leaveType.key, req.leaveType.grantMethod);
  const txCategory = leaveTxCategory(req.leaveType.key);

  await prisma.$transaction([
    prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", reviewedAt: new Date(), reviewedBy: actorId },
    }),
    ...(grantsOnRequest
      ? [prisma.leaveTransaction.create({
          data: {
            employeeId: req.employeeId, leaveTypeId: req.leaveTypeId,
            category: txCategory, txType: "GRANT" as const, days,
            reason: `${req.leaveType.name} 부여 (신청 시 부여)`, actorId, leaveRequestId: requestId,
          },
        })]
      : []),
    prisma.leaveTransaction.create({
      data: {
        employeeId: req.employeeId,
        leaveTypeId: req.leaveTypeId,
        category: txCategory,
        txType: "USE",
        days: -days,
        reason: "휴가 사용",
        actorId,
        leaveRequestId: requestId,
      },
    }),
    prisma.leaveBalance.upsert({
      where: { employeeId_leaveTypeId_year: { employeeId: req.employeeId, leaveTypeId: req.leaveTypeId, year } },
      create: { employeeId: req.employeeId, leaveTypeId: req.leaveTypeId, year, grantedDays: grantsOnRequest ? days : 0, usedDays: days },
      update: { usedDays: { increment: days }, ...(grantsOnRequest && { grantedDays: { increment: days } }) },
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
      unitType: r.unitType,
      schedule: parseSchedule(r.schedule),
    })),
  );
}

export async function cancelLeave(
  requestId: string,
  employeeId: string,
): Promise<Result<{ pendingApproval: boolean }>> {
  const req = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    select: {
      employeeId: true, leaveTypeId: true, days: true, status: true,
      startDate: true, endDate: true, formDocumentId: true,
      leaveType: {
        select: {
          key: true, grantMethod: true, name: true,
          approveOnCancel: true, approverEmployeeId: true, ccEmployeeIds: true,
        },
      },
    },
  });
  if (!req) return err(errors.notFound("휴가 신청을 찾을 수 없어요"));
  if (req.employeeId !== employeeId) return err(errors.forbidden("본인 신청만 취소할 수 있어요"));
  if (!["PENDING", "APPROVED"].includes(req.status))
    return err(errors.validation("취소할 수 없는 상태예요"));

  // 승인 완료 휴가 + 취소 승인 정책 + 승인자 지정 → 취소 승인 요청(즉시 취소하지 않음)
  if (req.status === "APPROVED" && req.leaveType.approveOnCancel && req.leaveType.approverEmployeeId) {
    const approverId = req.leaveType.approverEmployeeId;
    const me = await prisma.employee.findUnique({
      where: { id: employeeId }, select: { companyId: true, name: true },
    });
    if (!me) return err(errors.notFound("직원 정보를 찾을 수 없어요"));

    const startStr = req.startDate.toISOString().slice(0, 10);
    const endStr = req.endDate.toISOString().slice(0, 10);
    const cc = req.leaveType.ccEmployeeIds.filter((id) => id !== approverId);

    const created = await prisma.$transaction(async (tx) => {
      const doc = await tx.formDocument.create({
        data: {
          companyId: me.companyId,
          authorId: employeeId,
          title: `휴가 취소 신청 — ${req.leaveType.name} ${startStr}${endStr !== startStr ? `~${endStr}` : ""}`,
          kind: "LEAVE_REQUEST",
          formData: {
            cancelRequestId: requestId,
            leaveTypeName: req.leaveType.name,
            startDate: startStr,
            endDate: endStr,
            days: Number(req.days),
            reason: "휴가 취소 요청",
          },
          status: "IN_PROGRESS",
        },
        select: { id: true },
      });
      await tx.approvalLine.create({
        data: { documentId: doc.id, step: 1, approverId, status: "PENDING" },
      });
      if (cc.length > 0) {
        await tx.documentCcRecipient.createMany({
          data: cc.map((eid) => ({ documentId: doc.id, employeeId: eid })),
          skipDuplicates: true,
        });
      }
      await tx.leaveRequest.update({
        where: { id: requestId }, data: { status: "CANCEL_PENDING" },
      });
      return { docId: doc.id };
    });

    // 승인자 알림 (트랜잭션 밖 — 알림 실패가 취소 요청을 무효화하지 않음)
    await createNotification({
      companyId: me.companyId,
      recipientEmployeeId: approverId,
      category: "APPROVAL",
      eventKey: `leave_cancel:${requestId}`,
      title: "휴가 취소 승인 요청",
      body: `${me.name}님이 ${req.leaveType.name} 취소를 요청했어요.`,
      deepLink: `/workflow/documents/${created.docId}`,
      relatedTargetType: "LeaveRequest",
      relatedTargetId: requestId,
    }).catch(() => { /* 알림 실패 무시 */ });

    return ok({ pendingApproval: true });
  }

  // 그 외(결재 중 철회 / 즉시 취소 정책) → 즉시 취소 + 잔여 복원
  const year = req.startDate.getFullYear();
  const wasApproved = req.status === "APPROVED";
  const days = Number(req.days);
  const grantsOnRequest = !isPreGranted(req.leaveType.key, req.leaveType.grantMethod);
  const txCategory = leaveTxCategory(req.leaveType.key);

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
              category: txCategory,
              txType: "ADJUST",
              days,
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
            // 사용 복원 + 신청 시 부여였으면 부여분도 함께 회수(취소된 휴가가 잔여로 남지 않도록)
            data: { usedDays: { decrement: days }, ...(grantsOnRequest && { grantedDays: { decrement: days } }) },
          }),
        ]
      : []),
  ]);

  return ok({ pendingApproval: false });
}

/** 취소 승인 결재가 통과됐을 때 — 원 휴가를 취소하고 잔여 복원. 멱등(CANCEL_PENDING 일 때만). */
async function finalizeCancelApproved(requestId: string): Promise<void> {
  const req = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true, employeeId: true, leaveTypeId: true, days: true, status: true, startDate: true,
      leaveType: { select: { key: true, grantMethod: true } },
    },
  });
  if (!req || req.status !== "CANCEL_PENDING") return;

  const year = req.startDate.getFullYear();
  const days = Number(req.days);
  const grantsOnRequest = !isPreGranted(req.leaveType.key, req.leaveType.grantMethod);
  const txCategory = leaveTxCategory(req.leaveType.key);

  await prisma.$transaction([
    prisma.leaveRequest.update({ where: { id: req.id }, data: { status: "CANCELLED", reviewedAt: new Date() } }),
    prisma.leaveTransaction.create({
      data: {
        employeeId: req.employeeId, leaveTypeId: req.leaveTypeId,
        category: txCategory, txType: "ADJUST", days, reason: "휴가 취소 복원(승인)", leaveRequestId: req.id,
      },
    }),
    prisma.leaveBalance.update({
      where: { employeeId_leaveTypeId_year: { employeeId: req.employeeId, leaveTypeId: req.leaveTypeId, year } },
      data: { usedDays: { decrement: days }, ...(grantsOnRequest && { grantedDays: { decrement: days } }) },
    }),
  ]);
}

/** FormDocument.formData 에서 취소 요청 원본 ID 추출 (취소 결재 문서 판별). */
function extractCancelRequestId(formData: unknown): string | undefined {
  if (formData && typeof formData === "object" && !Array.isArray(formData)) {
    const v = (formData as Record<string, unknown>).cancelRequestId;
    if (typeof v === "string") return v;
  }
  return undefined;
}
