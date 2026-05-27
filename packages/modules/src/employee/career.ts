import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import type { EducationDegree, Gender } from "@teamlet/db";
import { catchDomainErr, loadActor } from "../permission/_actor";
import { assertPermission } from "../permission/assert";

const DIRECTORY_READ = "member.directory.read";
const DIRECTORY_MANAGE = "member.directory.manage";

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
    await assertPermission(actorEmployeeId, DIRECTORY_READ);
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
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
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
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
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
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
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
    await assertPermission(actorEmployeeId, DIRECTORY_READ);
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
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
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
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
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
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
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
    await assertPermission(actorEmployeeId, DIRECTORY_READ);
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
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
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
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
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
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  await prisma.familyMember.delete({ where: { id: familyMemberId } });
  return ok(undefined);
}
