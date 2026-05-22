/**
 * 직원 도메인 (docs/06 §2 구성원). P2 Core HR 시작점.
 *
 * P2 1단계: 디렉토리 read 흐름만 (listEmployees / getEmployee).
 * P2 2단계 이후: 직원 추가/수정/비활성화, 부서 연결, 직책/PositionHistory.
 *
 * 권한: `member.directory.read` scope-aware 평가.
 * - SUPER_ADMIN (ALL): 회사 전체 조회
 * - DYNAMIC_ORG_HEAD (DEPARTMENT): 본인 부서만 조회
 * - 권한 없음: 403
 */

import { prisma } from "@teamlet/db";
import type { EmploymentStatus, RoleType, Gender, EmploymentType } from "@teamlet/db";
import {
  employeeCreateSchema,
  employeeUpdateSchema,
  err,
  errors,
  ok,
  type EmployeeCreateInput,
  type EmployeeUpdateInput,
  type Result,
} from "@teamlet/shared";
import { recordAudit } from "../audit/index";
import { catchDomainErr, loadActor } from "../permission/_actor";
import { assertPermission } from "../permission/assert";
import { getEffectivePermissions } from "../permission/effective";
import { assertNotLastSuperAdmin } from "../permission/lockout";

const DIRECTORY_READ = "member.directory.read";
const DIRECTORY_MANAGE = "member.directory.manage";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type EmployeeListItem = {
  id: string;
  name: string;
  employeeNumber: string | null;
  companyEmail: string | null;
  hireDate: Date | null;
  employmentStatus: EmploymentStatus;
  employmentType: string;
  isActive: boolean;
  departmentId: string | null;
  departmentName: string | null;
  positionId: string | null;
  positionName: string | null;
};

export type EmployeeListFilter = {
  /** 특정 부서로 필터. `null` = 부서 미배정만. `undefined`/생략 = 전체. */
  departmentId?: string | null;
};

export async function listEmployees(
  actorEmployeeId: string,
  filter: EmployeeListFilter = {},
): Promise<Result<EmployeeListItem[]>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  // scope-aware 권한 검사: DEPARTMENT scope는 해당 부서만 조회
  const perms = await getEffectivePermissions(actorEmployeeId);
  const perm = perms.get(DIRECTORY_READ);
  if (!perm) return err(errors.forbidden("구성원 목록을 볼 권한이 없어요"));

  // DEPARTMENT scope → departmentIds 필터 적용 (scope bypass 방지)
  const scopedDeptIds =
    perm.scopeType === "DEPARTMENT" && perm.departmentIds.length > 0
      ? perm.departmentIds
      : null;

  // filter.departmentId가 있으면: scope 내에서만 허용
  let deptWhere: { departmentId?: string | { in: string[] } | null } = {};
  if (filter.departmentId !== undefined) {
    const allowed =
      !scopedDeptIds || filter.departmentId === null
        ? true
        : scopedDeptIds.includes(filter.departmentId);
    deptWhere = allowed ? { departmentId: filter.departmentId } : { departmentId: { in: [] } };
  } else if (scopedDeptIds) {
    deptWhere = { departmentId: { in: scopedDeptIds } };
  }

  const employees = await prisma.employee.findMany({
    where: {
      companyId: actor.companyId,
      ...deptWhere,
    },
    select: {
      id: true,
      name: true,
      employeeNumber: true,
      companyEmail: true,
      hireDate: true,
      employmentStatus: true,
      employmentType: true,
      isActive: true,
      departmentId: true,
      department: { select: { name: true } },
      positionId: true,
      position: { select: { name: true } },
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return ok(
    employees.map((e) => ({
      id: e.id,
      name: e.name,
      employeeNumber: e.employeeNumber,
      companyEmail: e.companyEmail,
      hireDate: e.hireDate,
      employmentStatus: e.employmentStatus,
      employmentType: e.employmentType,
      isActive: e.isActive,
      departmentId: e.departmentId,
      departmentName: e.department?.name ?? null,
      positionId: e.positionId,
      positionName: e.position?.name ?? null,
    })),
  );
}

/** 입력에서 받은 날짜 문자열 → Date | null. 빈 값 허용. */
function parseHireDate(raw: string | null): Result<Date | null> {
  if (!raw) return ok(null);
  if (!DATE_RE.test(raw)) {
    return err(errors.validation("입사일은 YYYY-MM-DD 형식이어야 해요"));
  }
  const d = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    return err(errors.validation("입사일을 인식할 수 없어요"));
  }
  return ok(d);
}

/**
 * 직원 정보 수정. `member.directory.manage` 가드. 모든 필드 전체 교체 패턴
 * (클라이언트가 default 값 채워서 보냄). 빈 문자열은 필드 지우기 의미.
 *
 * 부서·직책은 여기서 다루지 않음 — 시점 이력 보존을 위해 발령(Appointment) 경유
 * (`@teamlet/modules/appointment` createAppointment). Anti-Pattern #1.
 */
export async function updateEmployee(
  actorEmployeeId: string,
  employeeId: string,
  raw: EmployeeUpdateInput,
): Promise<Result<{ employeeId: string }>> {
  const parsed = employeeUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return err(
      errors.validation(parsed.error.issues[0]?.message ?? "입력 오류"),
    );
  }

  try {
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const current = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true, name: true, employeeNumber: true, companyEmail: true,
      personalEmail: true, phone: true, hireDate: true,
      departmentId: true, positionId: true, companyId: true,
    },
  });
  if (!current || current.companyId !== actor.companyId) {
    return err(errors.notFound("구성원을 찾을 수 없어요"));
  }

  const d = parsed.data;
  const employeeNumber = d.employeeNumber?.trim() || null;
  const companyEmail = d.companyEmail?.trim() || null;
  const personalEmail = d.personalEmail?.trim() || null;
  const phone = d.phone?.trim() || null;
  const gender = d.gender ?? null;
  const employmentType = d.employmentType ?? "FULL_TIME";
  const hireDateRaw = d.hireDate?.trim() || null;
  const birthDateRaw = d.birthDate?.trim() || null;
  const probationEndDateRaw = d.probationEndDate?.trim() || null;

  if (companyEmail && !EMAIL_RE.test(companyEmail)) {
    return err(errors.validation("올바른 회사 이메일 형식이 아니에요"));
  }
  if (personalEmail && !EMAIL_RE.test(personalEmail)) {
    return err(errors.validation("올바른 개인 이메일 형식이 아니에요"));
  }

  const hireDateResult = parseHireDate(hireDateRaw);
  if (!hireDateResult.ok) return hireDateResult;
  const hireDate = hireDateResult.data;

  const birthDateResult = parseHireDate(birthDateRaw);
  if (!birthDateResult.ok) return birthDateResult;
  const birthDate = birthDateResult.data;

  const probationEndDateResult = parseHireDate(probationEndDateRaw);
  if (!probationEndDateResult.ok) return probationEndDateResult;
  const probationEndDate = probationEndDateResult.data;

  if (companyEmail && companyEmail !== current.companyEmail) {
    const dup = await prisma.employee.findFirst({
      where: {
        companyId: actor.companyId,
        companyEmail,
        NOT: { id: employeeId },
      },
      select: { id: true },
    });
    if (dup) return err(errors.conflict("이미 사용 중인 회사 이메일이에요"));
  }

  const before = {
    name: current.name,
    employeeNumber: current.employeeNumber,
    companyEmail: current.companyEmail,
    personalEmail: current.personalEmail,
    hireDate: current.hireDate,
  };

  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      name: d.name,
      employeeNumber,
      companyEmail,
      personalEmail,
      phone,
      gender,
      employmentType,
      birthDate,
      probationEndDate,
      hireDate,
    },
    select: { id: true, name: true },
  });

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "member",
    eventType: "UPDATE",
    targetType: "Employee",
    targetId: employeeId,
    targetLabel: updated.name,
    description: `구성원 수정: ${updated.name}`,
    beforeSnapshot: before,
    afterSnapshot: {
      name: updated.name,
      employeeNumber,
      companyEmail,
      personalEmail,
      hireDate,
    },
  });

  return ok({ employeeId: updated.id });
}

/**
 * 직원 비활성화 (퇴직 처리). Employee.isActive=false + employmentStatus=RESIGNED +
 * 모든 활성 UserRole.isActive=false. 트랜잭션 처리.
 *
 * 가드:
 *  - `member.directory.manage`
 *  - 본인 비활성화 차단
 *  - SUPER_ADMIN UserRole 박탈 시 `assertNotLastSuperAdmin` (락아웃 가드)
 */
export async function deactivateEmployee(
  actorEmployeeId: string,
  targetEmployeeId: string,
  reason?: string,
): Promise<Result<{ employeeId: string }>> {
  try {
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  if (actorEmployeeId === targetEmployeeId) {
    return err(errors.conflict("본인은 비활성화할 수 없어요"));
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const emp = await prisma.employee.findUnique({
    where: { id: targetEmployeeId },
    select: {
      id: true,
      name: true,
      companyId: true,
      isActive: true,
      employmentStatus: true,
      userRoles: {
        where: {
          isActive: true,
          role: { type: "SYSTEM_SUPER_ADMIN", isActive: true },
        },
        select: { id: true },
      },
    },
  });
  if (!emp || emp.companyId !== actor.companyId) {
    return err(errors.notFound("구성원을 찾을 수 없어요"));
  }
  if (!emp.isActive) {
    return err(errors.conflict("이미 비활성화된 구성원이에요"));
  }

  if (emp.userRoles.length > 0) {
    const guard = await assertNotLastSuperAdmin(
      actor.companyId,
      emp.userRoles.map((ur) => ur.id),
    );
    if (!guard.ok) return guard;
  }

  await prisma.$transaction([
    prisma.employee.update({
      where: { id: targetEmployeeId },
      data: { isActive: false, employmentStatus: "RESIGNED" },
    }),
    prisma.userRole.updateMany({
      where: { employeeId: targetEmployeeId, isActive: true },
      data: { isActive: false },
    }),
  ]);

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "member",
    eventType: "UPDATE",
    targetType: "Employee",
    targetId: targetEmployeeId,
    targetLabel: emp.name,
    description: `구성원 비활성화 (퇴직): ${emp.name}${reason ? ` — ${reason}` : ""}`,
    beforeSnapshot: {
      isActive: true,
      employmentStatus: emp.employmentStatus,
    },
    afterSnapshot: {
      isActive: false,
      employmentStatus: "RESIGNED",
    },
  });

  return ok({ employeeId: targetEmployeeId });
}

export type EmployeeRoleAssignment = {
  userRoleId: string;
  roleId: string;
  roleName: string;
  roleType: RoleType;
  isSystem: boolean;
  assignedAt: Date;
};

export type EmployeeDetail = EmployeeListItem & {
  personalEmail: string | null;
  phone: string | null;
  birthDate: Date | null;
  gender: Gender | null;
  employmentType: EmploymentType;
  probationEndDate: Date | null;
  resignedAt: Date | null;
  leaveBalances: { leaveTypeName: string; remaining: number }[];
  createdAt: Date;
  roles: EmployeeRoleAssignment[];
  hasLinkedAccount: boolean;
};

/**
 * 직원 상세 조회. 권한 가드: `member.directory.read`.
 * 다른 회사 직원 id 는 NOT_FOUND 로 은닉.
 */
export async function getEmployee(
  actorEmployeeId: string,
  employeeId: string,
): Promise<Result<EmployeeDetail>> {
  try {
    await assertPermission(actorEmployeeId, DIRECTORY_READ);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const emp = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      name: true,
      employeeNumber: true,
      companyEmail: true,
      personalEmail: true,
      phone: true,
      birthDate: true,
      gender: true,
      employmentType: true,
      probationEndDate: true,
      resignedAt: true,
      hireDate: true,
      employmentStatus: true,
      isActive: true,
      companyId: true,
      departmentId: true,
      positionId: true,
      createdAt: true,
      department: { select: { name: true } },
      position: { select: { name: true, isOrgHead: true } },
      leaveBalances: {
        select: {
          grantedDays: true,
          usedDays: true,
          adjustedDays: true,
          leaveType: { select: { name: true } },
        },
      },
      userRoles: {
        where: { isActive: true },
        orderBy: { assignedAt: "desc" },
        select: {
          id: true,
          assignedAt: true,
          role: {
            select: {
              id: true,
              name: true,
              type: true,
              isSystem: true,
            },
          },
        },
      },
      membership: { select: { status: true } },
    },
  });

  if (!emp || emp.companyId !== actor.companyId) {
    return err(errors.notFound("구성원을 찾을 수 없어요"));
  }

  return ok({
    id: emp.id,
    name: emp.name,
    employeeNumber: emp.employeeNumber,
    companyEmail: emp.companyEmail,
    personalEmail: emp.personalEmail,
    phone: emp.phone,
    birthDate: emp.birthDate,
    gender: emp.gender,
    employmentType: emp.employmentType,
    probationEndDate: emp.probationEndDate,
    resignedAt: emp.resignedAt,
    hireDate: emp.hireDate,
    employmentStatus: emp.employmentStatus,
    isActive: emp.isActive,
    departmentId: emp.departmentId,
    departmentName: emp.department?.name ?? null,
    positionId: emp.positionId,
    positionName: emp.position?.name ?? null,
    leaveBalances: emp.leaveBalances.map((lb) => ({
      leaveTypeName: lb.leaveType.name,
      remaining: Number(lb.grantedDays) + Number(lb.adjustedDays) - Number(lb.usedDays),
    })),
    createdAt: emp.createdAt,
    roles: emp.userRoles.map((ur) => ({
      userRoleId: ur.id,
      roleId: ur.role.id,
      roleName: ur.role.name,
      roleType: ur.role.type,
      isSystem: ur.role.isSystem,
      assignedAt: ur.assignedAt,
    })),
    hasLinkedAccount: emp.membership?.status === "ACTIVE",
  });
}

/**
 * 직원 추가 — Employee row 만 생성 (사용자 계정 연결 없이).
 * 계정 연결(membership) 은 별도 초대 흐름에서 처리. 여기서는 디렉토리 풍성화가 목적.
 */
export async function createEmployee(
  actorEmployeeId: string,
  raw: EmployeeCreateInput,
): Promise<Result<{ employeeId: string }>> {
  const parsed = employeeCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return err(
      errors.validation(parsed.error.issues[0]?.message ?? "입력 오류"),
    );
  }

  try {
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const d = parsed.data;
  const employeeNumber = d.employeeNumber?.trim() || null;
  const companyEmail = d.companyEmail?.trim() || null;
  const hireDateRaw = d.hireDate?.trim() || null;
  const departmentId = d.departmentId?.trim() || null;
  const positionId = d.positionId?.trim() || null;

  if (companyEmail && !EMAIL_RE.test(companyEmail)) {
    return err(errors.validation("올바른 이메일 형식이 아니에요"));
  }

  let hireDate: Date | null = null;
  if (hireDateRaw) {
    if (!DATE_RE.test(hireDateRaw)) {
      return err(errors.validation("입사일은 YYYY-MM-DD 형식이어야 해요"));
    }
    const parsedDate = new Date(`${hireDateRaw}T00:00:00.000Z`);
    if (Number.isNaN(parsedDate.getTime())) {
      return err(errors.validation("입사일을 인식할 수 없어요"));
    }
    hireDate = parsedDate;
  }

  let deptName: string | null = null;
  if (departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { companyId: true, isActive: true, name: true },
    });
    if (!dept || dept.companyId !== actor.companyId) {
      return err(errors.notFound("부서를 찾을 수 없어요"));
    }
    if (!dept.isActive) {
      return err(errors.conflict("비활성 부서엔 배정할 수 없어요"));
    }
    deptName = dept.name;
  }

  let posName: string | null = null;
  if (positionId) {
    const pos = await prisma.position.findUnique({
      where: { id: positionId },
      select: { companyId: true, isActive: true, name: true },
    });
    if (!pos || pos.companyId !== actor.companyId) {
      return err(errors.notFound("직책을 찾을 수 없어요"));
    }
    if (!pos.isActive) {
      return err(errors.conflict("비활성 직책엔 배정할 수 없어요"));
    }
    posName = pos.name;
  }

  if (companyEmail) {
    const dup = await prisma.employee.findFirst({
      where: { companyId: actor.companyId, companyEmail },
      select: { id: true },
    });
    if (dup) return err(errors.conflict("이미 사용 중인 회사 이메일이에요"));
  }

  const actorEmp = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { name: true },
  });

  const employee = await prisma.$transaction(async (tx) => {
    const created = await tx.employee.create({
      data: {
        companyId: actor.companyId,
        departmentId,
        positionId,
        name: d.name,
        employeeNumber,
        companyEmail,
        hireDate,
        employmentStatus: "ACTIVE",
      },
    });
    await tx.appointment.create({
      data: {
        companyId: actor.companyId,
        employeeId: created.id,
        kind: "HIRE",
        effectiveDate: hireDate ?? new Date(),
        toDepartmentId: departmentId,
        toDepartmentName: deptName,
        toPositionId: positionId,
        toPositionName: posName,
        appointedById: actorEmployeeId,
        appointedByName: actorEmp?.name ?? null,
      },
    });
    return created;
  });

  await recordAudit({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    activityType: "member",
    eventType: "CREATE",
    targetType: "Employee",
    targetId: employee.id,
    targetLabel: employee.name,
    description: `구성원 추가: ${employee.name}`,
    afterSnapshot: {
      name: employee.name,
      employeeNumber,
      companyEmail,
      hireDate,
      departmentId,
      positionId,
    },
  });

  return ok({ employeeId: employee.id });
}

export { bulkCreateEmployees, type BulkEmployeeRow, type BulkCreateResult } from "./bulk";
