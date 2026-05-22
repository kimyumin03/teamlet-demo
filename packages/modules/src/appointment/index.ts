/**
 * 인사 발령 도메인 (docs/03 §1 Appointment). P2 Depth 보강.
 *
 * 핵심 원칙 (CLAUDE.md Anti-Pattern #1):
 *  - 직원의 부서·직책 변경은 항상 새 `Appointment` row 추가 — UPDATE 덮어쓰기 금지.
 *  - `Employee.departmentId / positionId` 는 최신 발령을 반영하는 비정규화 캐시.
 *  - 발령 row 는 불변. 부서·직책 이름은 발령 시점 값으로 스냅샷 (개명·삭제 대비).
 *
 * 권한: 등록 `member.directory.manage`, 조회 `member.directory.read`.
 */

import { prisma } from "@teamlet/db";
import type { AppointmentKind } from "@teamlet/db";
import {
  appointmentCreateSchema,
  err,
  errors,
  ok,
  type AppointmentCreateInput,
  type Result,
} from "@teamlet/shared";
import { recordAudit } from "../audit/index";
import { catchDomainErr, loadActor } from "../permission/_actor";
import { assertPermission } from "../permission/assert";

const DIRECTORY_READ = "member.directory.read";
const DIRECTORY_MANAGE = "member.directory.manage";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const APPOINTMENT_KIND_LABEL: Record<AppointmentKind, string> = {
  HIRE: "입사",
  TRANSFER: "부서 이동",
  PROMOTION: "승진",
  POSITION_CHANGE: "직책 변경",
  REASSIGN: "부서·직책 변경",
};

/** 발령일 문자열 → Date. YYYY-MM-DD 형식만 허용. */
function parseEffectiveDate(raw: string): Result<Date> {
  if (!DATE_RE.test(raw)) {
    return err(errors.validation("발령일은 YYYY-MM-DD 형식이어야 해요"));
  }
  const d = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    return err(errors.validation("발령일을 인식할 수 없어요"));
  }
  return ok(d);
}

/**
 * 인사 발령 등록. `member.directory.manage` 가드.
 * 발령 row 생성 + Employee 부서·직책 캐시 갱신을 한 트랜잭션으로 처리.
 */
export async function createAppointment(
  actorEmployeeId: string,
  raw: AppointmentCreateInput,
): Promise<Result<{ appointmentId: string }>> {
  const parsed = appointmentCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return err(errors.validation(parsed.error.issues[0]?.message ?? "입력 오류"));
  }

  try {
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const d = parsed.data;

  const dateResult = parseEffectiveDate(d.effectiveDate.trim());
  if (!dateResult.ok) return dateResult;
  const effectiveDate = dateResult.data;

  const emp = await prisma.employee.findUnique({
    where: { id: d.employeeId },
    select: {
      id: true,
      name: true,
      companyId: true,
      isActive: true,
      departmentId: true,
      positionId: true,
      department: { select: { name: true } },
      position: { select: { name: true } },
    },
  });
  if (!emp || emp.companyId !== actor.companyId) {
    return err(errors.notFound("구성원을 찾을 수 없어요"));
  }
  if (!emp.isActive) {
    return err(errors.conflict("비활성 구성원은 발령할 수 없어요"));
  }

  const toDepartmentId = d.departmentId?.trim() || null;
  const toPositionId = d.positionId?.trim() || null;

  // 대상 부서 검증 + 이름 스냅샷
  let toDepartmentName: string | null = null;
  if (toDepartmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: toDepartmentId },
      select: { companyId: true, isActive: true, name: true },
    });
    if (!dept || dept.companyId !== actor.companyId) {
      return err(errors.notFound("부서를 찾을 수 없어요"));
    }
    if (!dept.isActive) {
      return err(errors.conflict("비활성 부서엔 배정할 수 없어요"));
    }
    toDepartmentName = dept.name;
  }

  // 대상 직책 검증 + 이름 스냅샷
  let toPositionName: string | null = null;
  if (toPositionId) {
    const pos = await prisma.position.findUnique({
      where: { id: toPositionId },
      select: { companyId: true, isActive: true, name: true },
    });
    if (!pos || pos.companyId !== actor.companyId) {
      return err(errors.notFound("직책을 찾을 수 없어요"));
    }
    if (!pos.isActive) {
      return err(errors.conflict("비활성 직책엔 배정할 수 없어요"));
    }
    toPositionName = pos.name;
  }

  // 변경 없음 차단
  if (toDepartmentId === emp.departmentId && toPositionId === emp.positionId) {
    return err(errors.validation("부서·직책에 바뀐 내용이 없어요"));
  }

  // 발령일 단조 보장 — Employee 캐시(= 최신 발령)의 정합성 유지
  const latest = await prisma.appointment.findFirst({
    where: { employeeId: emp.id },
    orderBy: { effectiveDate: "desc" },
    select: { effectiveDate: true },
  });
  if (latest && effectiveDate.getTime() < latest.effectiveDate.getTime()) {
    return err(errors.validation("발령일은 직전 발령일보다 빠를 수 없어요"));
  }

  // 발령 처리자 이름 스냅샷
  const actorEmp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { name: true },
  });

  const appointment = await prisma.$transaction(async (tx) => {
    const created = await tx.appointment.create({
      data: {
        companyId: actor.companyId,
        employeeId: emp.id,
        kind: d.kind,
        effectiveDate,
        fromDepartmentId: emp.departmentId,
        fromDepartmentName: emp.department?.name ?? null,
        toDepartmentId,
        toDepartmentName,
        fromPositionId: emp.positionId,
        fromPositionName: emp.position?.name ?? null,
        toPositionId,
        toPositionName,
        memo: d.memo?.trim() || null,
        appointedById: actorEmployeeId,
        appointedByName: actorEmp?.name ?? null,
      },
    });
    // 최신 발령을 Employee 캐시에 반영
    await tx.employee.update({
      where: { id: emp.id },
      data: { departmentId: toDepartmentId, positionId: toPositionId },
    });
    return created;
  });

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "member",
    eventType: "CREATE",
    targetType: "Appointment",
    targetId: appointment.id,
    targetLabel: emp.name,
    description: `인사 발령: ${emp.name} — ${APPOINTMENT_KIND_LABEL[d.kind]}`,
    beforeSnapshot: {
      departmentName: emp.department?.name ?? null,
      positionName: emp.position?.name ?? null,
    },
    afterSnapshot: {
      kind: d.kind,
      effectiveDate,
      departmentName: toDepartmentName,
      positionName: toPositionName,
    },
  });

  return ok({ appointmentId: appointment.id });
}

export type AppointmentItem = {
  id: string;
  kind: AppointmentKind;
  kindLabel: string;
  effectiveDate: Date;
  fromDepartmentName: string | null;
  toDepartmentName: string | null;
  fromPositionName: string | null;
  toPositionName: string | null;
  memo: string | null;
  appointedByName: string | null;
  createdAt: Date;
};

/**
 * 직원의 발령 이력 조회. `member.directory.read` 가드.
 * 최신 발령일 순. 다른 회사 직원 id 는 NOT_FOUND 로 은닉.
 */
export async function listAppointments(
  actorEmployeeId: string,
  employeeId: string,
): Promise<Result<AppointmentItem[]>> {
  try {
    await assertPermission(actorEmployeeId, DIRECTORY_READ);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { companyId: true },
  });
  if (!emp || emp.companyId !== actor.companyId) {
    return err(errors.notFound("구성원을 찾을 수 없어요"));
  }

  const rows = await prisma.appointment.findMany({
    where: { employeeId, companyId: actor.companyId },
    orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
  });

  return ok(
    rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      kindLabel: APPOINTMENT_KIND_LABEL[r.kind],
      effectiveDate: r.effectiveDate,
      fromDepartmentName: r.fromDepartmentName,
      toDepartmentName: r.toDepartmentName,
      fromPositionName: r.fromPositionName,
      toPositionName: r.toPositionName,
      memo: r.memo,
      appointedByName: r.appointedByName,
      createdAt: r.createdAt,
    })),
  );
}

/**
 * 시점 기반 조회 — 특정 날짜 시점의 부서·직책 (CLAUDE.md 시점 쿼리 컨벤션).
 * 해당 날짜 이하의 가장 최근 발령을 채택. 발령 이력이 없으면 null.
 * 저수준 유틸 — 권한 가드 없음. 호출부에서 가드할 것.
 */
export async function getEmployeePositionAt(
  employeeId: string,
  date: Date,
): Promise<{ departmentId: string | null; positionId: string | null } | null> {
  const appt = await prisma.appointment.findFirst({
    where: { employeeId, effectiveDate: { lte: date } },
    orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
    select: { toDepartmentId: true, toPositionId: true },
  });
  if (!appt) return null;
  return { departmentId: appt.toDepartmentId, positionId: appt.toPositionId };
}
