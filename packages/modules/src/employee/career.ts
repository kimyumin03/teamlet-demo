import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import type { EducationDegree, Gender } from "@teamlet/db";
import { catchDomainErr } from "../permission/_actor";
import { assertPermission } from "../permission/assert";

const DIRECTORY_READ = "member.directory.read";
const DIRECTORY_MANAGE = "member.directory.manage";

// ── 테넌트 격리 헬퍼 (C1: cross-tenant IDOR 방지) ──────────────────
//
// assertPermission 은 actor 회사 기준 권한만 본다. target 이 같은 회사인지,
// scope(SELF/DEPARTMENT) 가 맞는지는 호출부가 ctx 로 넘겨야 한다.
// 아래 헬퍼로 ① target 이 actor 와 동일 회사인지 검증하고
// ② scope 평가용 targetEmployeeId/targetDepartmentId 를 확보한다.
// cross-tenant 접근은 존재를 흘리지 않도록 NOT_FOUND 로 은닉한다.

type ScopeTarget = { targetEmployeeId: string; targetDepartmentId?: string };

async function resolveActorCompany(actorEmployeeId: string): Promise<string> {
  const actor = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: { companyId: true },
  });
  if (!actor) throw errors.notFound("구성원을 찾을 수 없어요");
  return actor.companyId;
}

/** targetEmployeeId 가 actor 와 같은 회사인지 검증. scope ctx 반환. */
async function assertTargetInCompany(
  actorEmployeeId: string,
  targetEmployeeId: string,
): Promise<ScopeTarget> {
  const companyId = await resolveActorCompany(actorEmployeeId);
  const target = await prisma.employee.findFirst({
    where: { id: targetEmployeeId, companyId },
    select: { id: true, departmentId: true },
  });
  if (!target) throw errors.notFound("구성원을 찾을 수 없어요");
  return { targetEmployeeId: target.id, targetDepartmentId: target.departmentId ?? undefined };
}

/** 하위 레코드(경력/학력/가족) 소유 구성원이 actor 와 같은 회사인지 검증. scope ctx 반환. */
async function assertRowOwnerInCompany(
  actorEmployeeId: string,
  owner: { id: string; companyId: string; departmentId: string | null } | null,
): Promise<ScopeTarget> {
  const companyId = await resolveActorCompany(actorEmployeeId);
  if (!owner || owner.companyId !== companyId) {
    throw errors.notFound("기록을 찾을 수 없어요");
  }
  return { targetEmployeeId: owner.id, targetDepartmentId: owner.departmentId ?? undefined };
}

// ── 경력 ────────────────────────────────────────────────────────

export type CareerHistoryItem = {
  id: string;
  companyName: string;
  position: string;
  department: string;
  startDate: Date;
  endDate: Date | null;
  description: string;
  sortOrder: number;
};

export type CareerHistoryInput = {
  companyName: string;
  position: string;
  department?: string;
  startDate: string;
  endDate?: string | null;
  description?: string;
};

export async function listCareerHistories(
  actorEmployeeId: string,
  targetEmployeeId: string,
): Promise<Result<CareerHistoryItem[]>> {
  try {
    const ctx = await assertTargetInCompany(actorEmployeeId, targetEmployeeId);
    await assertPermission(actorEmployeeId, DIRECTORY_READ, ctx);
  } catch (e) {
    return catchDomainErr(e);
  }

  const rows = await prisma.careerHistory.findMany({
    where: { employeeId: targetEmployeeId },
    orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }],
  });

  return ok(
    rows.map((r) => ({
      id: r.id,
      companyName: r.companyName,
      position: r.position,
      department: r.department,
      startDate: r.startDate,
      endDate: r.endDate,
      description: r.description,
      sortOrder: r.sortOrder,
    })),
  );
}

export async function createCareerHistory(
  actorEmployeeId: string,
  targetEmployeeId: string,
  input: CareerHistoryInput,
): Promise<Result<{ id: string }>> {
  try {
    const ctx = await assertTargetInCompany(actorEmployeeId, targetEmployeeId);
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE, ctx);
  } catch (e) {
    return catchDomainErr(e);
  }

  if (!input.companyName.trim()) return err(errors.validation("회사명을 입력해 주세요"));
  if (!input.position.trim()) return err(errors.validation("직위/직책을 입력해 주세요"));
  if (!input.startDate) return err(errors.validation("입사일을 입력해 주세요"));

  const max = await prisma.careerHistory.aggregate({
    where: { employeeId: targetEmployeeId },
    _max: { sortOrder: true },
  });

  const row = await prisma.careerHistory.create({
    data: {
      employeeId: targetEmployeeId,
      companyName: input.companyName.trim(),
      position: input.position.trim(),
      department: input.department?.trim() ?? "",
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      description: input.description?.trim() ?? "",
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
    select: { id: true },
  });

  return ok(row);
}

export async function updateCareerHistory(
  actorEmployeeId: string,
  careerHistoryId: string,
  input: Partial<CareerHistoryInput>,
): Promise<Result<void>> {
  try {
    const row = await prisma.careerHistory.findUnique({
      where: { id: careerHistoryId },
      select: { employee: { select: { id: true, companyId: true, departmentId: true } } },
    });
    const ctx = await assertRowOwnerInCompany(actorEmployeeId, row?.employee ?? null);
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE, ctx);
  } catch (e) {
    return catchDomainErr(e);
  }

  await prisma.careerHistory.update({
    where: { id: careerHistoryId },
    data: {
      ...(input.companyName !== undefined && { companyName: input.companyName.trim() }),
      ...(input.position !== undefined && { position: input.position.trim() }),
      ...(input.department !== undefined && { department: input.department.trim() }),
      ...(input.startDate !== undefined && { startDate: new Date(input.startDate) }),
      ...(input.endDate !== undefined && { endDate: input.endDate ? new Date(input.endDate) : null }),
      ...(input.description !== undefined && { description: input.description.trim() }),
    },
  });

  return ok(undefined);
}

export async function deleteCareerHistory(
  actorEmployeeId: string,
  careerHistoryId: string,
): Promise<Result<void>> {
  try {
    const row = await prisma.careerHistory.findUnique({
      where: { id: careerHistoryId },
      select: { employee: { select: { id: true, companyId: true, departmentId: true } } },
    });
    const ctx = await assertRowOwnerInCompany(actorEmployeeId, row?.employee ?? null);
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE, ctx);
  } catch (e) {
    return catchDomainErr(e);
  }

  await prisma.careerHistory.delete({ where: { id: careerHistoryId } });
  return ok(undefined);
}

// ── 학력 ────────────────────────────────────────────────────────

export type EducationHistoryItem = {
  id: string;
  schoolName: string;
  major: string;
  degree: EducationDegree;
  enrollDate: Date;
  graduateDate: Date | null;
  description: string;
  sortOrder: number;
};

export type EducationHistoryInput = {
  schoolName: string;
  major?: string;
  degree?: EducationDegree;
  enrollDate: string;
  graduateDate?: string | null;
  description?: string;
};

export async function listEducationHistories(
  actorEmployeeId: string,
  targetEmployeeId: string,
): Promise<Result<EducationHistoryItem[]>> {
  try {
    const ctx = await assertTargetInCompany(actorEmployeeId, targetEmployeeId);
    await assertPermission(actorEmployeeId, DIRECTORY_READ, ctx);
  } catch (e) {
    return catchDomainErr(e);
  }

  const rows = await prisma.educationHistory.findMany({
    where: { employeeId: targetEmployeeId },
    orderBy: [{ sortOrder: "asc" }, { enrollDate: "desc" }],
  });

  return ok(
    rows.map((r) => ({
      id: r.id,
      schoolName: r.schoolName,
      major: r.major,
      degree: r.degree,
      enrollDate: r.enrollDate,
      graduateDate: r.graduateDate,
      description: r.description,
      sortOrder: r.sortOrder,
    })),
  );
}

export async function createEducationHistory(
  actorEmployeeId: string,
  targetEmployeeId: string,
  input: EducationHistoryInput,
): Promise<Result<{ id: string }>> {
  try {
    const ctx = await assertTargetInCompany(actorEmployeeId, targetEmployeeId);
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE, ctx);
  } catch (e) {
    return catchDomainErr(e);
  }

  if (!input.schoolName.trim()) return err(errors.validation("학교명을 입력해 주세요"));
  if (!input.enrollDate) return err(errors.validation("입학일을 입력해 주세요"));

  const max = await prisma.educationHistory.aggregate({
    where: { employeeId: targetEmployeeId },
    _max: { sortOrder: true },
  });

  const row = await prisma.educationHistory.create({
    data: {
      employeeId: targetEmployeeId,
      schoolName: input.schoolName.trim(),
      major: input.major?.trim() ?? "",
      degree: input.degree ?? "BACHELOR",
      enrollDate: new Date(input.enrollDate),
      graduateDate: input.graduateDate ? new Date(input.graduateDate) : null,
      description: input.description?.trim() ?? "",
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
    select: { id: true },
  });

  return ok(row);
}

export async function updateEducationHistory(
  actorEmployeeId: string,
  educationHistoryId: string,
  input: Partial<EducationHistoryInput>,
): Promise<Result<void>> {
  try {
    const row = await prisma.educationHistory.findUnique({
      where: { id: educationHistoryId },
      select: { employee: { select: { id: true, companyId: true, departmentId: true } } },
    });
    const ctx = await assertRowOwnerInCompany(actorEmployeeId, row?.employee ?? null);
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE, ctx);
  } catch (e) {
    return catchDomainErr(e);
  }

  await prisma.educationHistory.update({
    where: { id: educationHistoryId },
    data: {
      ...(input.schoolName !== undefined && { schoolName: input.schoolName.trim() }),
      ...(input.major !== undefined && { major: input.major.trim() }),
      ...(input.degree !== undefined && { degree: input.degree }),
      ...(input.enrollDate !== undefined && { enrollDate: new Date(input.enrollDate) }),
      ...(input.graduateDate !== undefined && { graduateDate: input.graduateDate ? new Date(input.graduateDate) : null }),
      ...(input.description !== undefined && { description: input.description.trim() }),
    },
  });

  return ok(undefined);
}

export async function deleteEducationHistory(
  actorEmployeeId: string,
  educationHistoryId: string,
): Promise<Result<void>> {
  try {
    const row = await prisma.educationHistory.findUnique({
      where: { id: educationHistoryId },
      select: { employee: { select: { id: true, companyId: true, departmentId: true } } },
    });
    const ctx = await assertRowOwnerInCompany(actorEmployeeId, row?.employee ?? null);
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE, ctx);
  } catch (e) {
    return catchDomainErr(e);
  }

  await prisma.educationHistory.delete({ where: { id: educationHistoryId } });
  return ok(undefined);
}

// ── 가족 ────────────────────────────────────────────────────────

export type FamilyMemberItem = {
  id: string;
  name: string;
  relationship: string;
  birthDate: Date | null;
  isDependent: boolean;
  gender: Gender | null;
  sortOrder: number;
};

export type FamilyMemberInput = {
  name: string;
  relationship: string;
  birthDate?: string | null;
  isDependent?: boolean;
  gender?: Gender | null;
};

export async function listFamilyMembers(
  actorEmployeeId: string,
  targetEmployeeId: string,
): Promise<Result<FamilyMemberItem[]>> {
  try {
    const ctx = await assertTargetInCompany(actorEmployeeId, targetEmployeeId);
    await assertPermission(actorEmployeeId, DIRECTORY_READ, ctx);
  } catch (e) {
    return catchDomainErr(e);
  }

  const rows = await prisma.familyMember.findMany({
    where: { employeeId: targetEmployeeId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return ok(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      relationship: r.relationship,
      birthDate: r.birthDate,
      isDependent: r.isDependent,
      gender: r.gender,
      sortOrder: r.sortOrder,
    })),
  );
}

export async function createFamilyMember(
  actorEmployeeId: string,
  targetEmployeeId: string,
  input: FamilyMemberInput,
): Promise<Result<{ id: string }>> {
  try {
    const ctx = await assertTargetInCompany(actorEmployeeId, targetEmployeeId);
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE, ctx);
  } catch (e) {
    return catchDomainErr(e);
  }

  if (!input.name.trim()) return err(errors.validation("이름을 입력해 주세요"));
  if (!input.relationship.trim()) return err(errors.validation("관계를 입력해 주세요"));

  const max = await prisma.familyMember.aggregate({
    where: { employeeId: targetEmployeeId },
    _max: { sortOrder: true },
  });

  const row = await prisma.familyMember.create({
    data: {
      employeeId: targetEmployeeId,
      name: input.name.trim(),
      relationship: input.relationship.trim(),
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
      isDependent: input.isDependent ?? false,
      gender: input.gender ?? null,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
    select: { id: true },
  });

  return ok(row);
}

export async function updateFamilyMember(
  actorEmployeeId: string,
  familyMemberId: string,
  input: Partial<FamilyMemberInput>,
): Promise<Result<void>> {
  try {
    const row = await prisma.familyMember.findUnique({
      where: { id: familyMemberId },
      select: { employee: { select: { id: true, companyId: true, departmentId: true } } },
    });
    const ctx = await assertRowOwnerInCompany(actorEmployeeId, row?.employee ?? null);
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE, ctx);
  } catch (e) {
    return catchDomainErr(e);
  }

  await prisma.familyMember.update({
    where: { id: familyMemberId },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.relationship !== undefined && { relationship: input.relationship.trim() }),
      ...(input.birthDate !== undefined && { birthDate: input.birthDate ? new Date(input.birthDate) : null }),
      ...(input.isDependent !== undefined && { isDependent: input.isDependent }),
      ...(input.gender !== undefined && { gender: input.gender }),
    },
  });

  return ok(undefined);
}

export async function deleteFamilyMember(
  actorEmployeeId: string,
  familyMemberId: string,
): Promise<Result<void>> {
  try {
    const row = await prisma.familyMember.findUnique({
      where: { id: familyMemberId },
      select: { employee: { select: { id: true, companyId: true, departmentId: true } } },
    });
    const ctx = await assertRowOwnerInCompany(actorEmployeeId, row?.employee ?? null);
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE, ctx);
  } catch (e) {
    return catchDomainErr(e);
  }

  await prisma.familyMember.delete({ where: { id: familyMemberId } });
  return ok(undefined);
}
