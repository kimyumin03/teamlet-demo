/**
 * 직원 도메인 (docs/06 §2 구성원). P2 Core HR 시작점.
 *
 * P2 1단계: 디렉토리 read 흐름만 (listEmployees / getEmployee).
 * P2 2단계 이후: 직원 추가/수정/비활성화, 부서 연결, 직책/PositionHistory.
 *
 * 권한: `member.directory.read` (ALL scope 만 P1 평가 모듈 지원).
 * - SUPER_ADMIN: ALL → 회사 전체
 * - 일반 직원: 권한 미보유 → 페이지 진입 자체 막힘
 * - SELF scope: P2 에서 자기 자신만 보이는 분기 추가 예정
 */

import { prisma } from "@teamlet/db";
import type { EmploymentStatus, RoleType } from "@teamlet/db";
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
  isActive: boolean;
  departmentId: string | null;
  departmentName: string | null;
};

export type EmployeeListFilter = {
  /** 특정 부서로 필터. `null` = 부서 미배정만. `undefined`/생략 = 전체. */
  departmentId?: string | null;
};

export async function listEmployees(
  actorEmployeeId: string,
  filter: EmployeeListFilter = {},
): Promise<Result<EmployeeListItem[]>> {
  try {
    await assertPermission(actorEmployeeId, DIRECTORY_READ);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const employees = await prisma.employee.findMany({
    where: {
      companyId: actor.companyId,
      ...(filter.departmentId !== undefined
        ? { departmentId: filter.departmentId }
        : {}),
    },
    select: {
      id: true,
      name: true,
      employeeNumber: true,
      companyEmail: true,
      hireDate: true,
      employmentStatus: true,
      isActive: true,
      departmentId: true,
      department: { select: { name: true } },
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
      isActive: e.isActive,
      departmentId: e.departmentId,
      departmentName: e.department?.name ?? null,
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
      id: true,
      name: true,
      employeeNumber: true,
      companyEmail: true,
      personalEmail: true,
      hireDate: true,
      departmentId: true,
      companyId: true,
    },
  });
  if (!current || current.companyId !== actor.companyId) {
    return err(errors.notFound("구성원을 찾을 수 없어요"));
  }

  const d = parsed.data;
  const employeeNumber = d.employeeNumber?.trim() || null;
  const companyEmail = d.companyEmail?.trim() || null;
  const personalEmail = d.personalEmail?.trim() || null;
  const hireDateRaw = d.hireDate?.trim() || null;
  const departmentId = d.departmentId?.trim() || null;

  if (companyEmail && !EMAIL_RE.test(companyEmail)) {
    return err(errors.validation("올바른 회사 이메일 형식이 아니에요"));
  }
  if (personalEmail && !EMAIL_RE.test(personalEmail)) {
    return err(errors.validation("올바른 개인 이메일 형식이 아니에요"));
  }

  const hireDateResult = parseHireDate(hireDateRaw);
  if (!hireDateResult.ok) return hireDateResult;
  const hireDate = hireDateResult.data;

  if (departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { companyId: true, isActive: true },
    });
    if (!dept || dept.companyId !== actor.companyId) {
      return err(errors.notFound("부서를 찾을 수 없어요"));
    }
    if (!dept.isActive) {
      return err(errors.conflict("비활성 부서엔 배정할 수 없어요"));
    }
  }

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
    departmentId: current.departmentId,
  };

  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      name: d.name,
      employeeNumber,
      companyEmail,
      personalEmail,
      hireDate,
      departmentId,
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
      departmentId,
    },
  });

  return ok({ employeeId: updated.id });
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
  createdAt: Date;
  roles: EmployeeRoleAssignment[];
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
      hireDate: true,
      employmentStatus: true,
      isActive: true,
      companyId: true,
      departmentId: true,
      createdAt: true,
      department: { select: { name: true } },
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
    hireDate: emp.hireDate,
    employmentStatus: emp.employmentStatus,
    isActive: emp.isActive,
    departmentId: emp.departmentId,
    departmentName: emp.department?.name ?? null,
    createdAt: emp.createdAt,
    roles: emp.userRoles.map((ur) => ({
      userRoleId: ur.id,
      roleId: ur.role.id,
      roleName: ur.role.name,
      roleType: ur.role.type,
      isSystem: ur.role.isSystem,
      assignedAt: ur.assignedAt,
    })),
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

  if (departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { companyId: true, isActive: true },
    });
    if (!dept || dept.companyId !== actor.companyId) {
      return err(errors.notFound("부서를 찾을 수 없어요"));
    }
    if (!dept.isActive) {
      return err(errors.conflict("비활성 부서엔 배정할 수 없어요"));
    }
  }

  if (companyEmail) {
    const dup = await prisma.employee.findFirst({
      where: { companyId: actor.companyId, companyEmail },
      select: { id: true },
    });
    if (dup) return err(errors.conflict("이미 사용 중인 회사 이메일이에요"));
  }

  const employee = await prisma.employee.create({
    data: {
      companyId: actor.companyId,
      departmentId,
      name: d.name,
      employeeNumber,
      companyEmail,
      hireDate,
      employmentStatus: "ACTIVE",
    },
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
    },
  });

  return ok({ employeeId: employee.id });
}
