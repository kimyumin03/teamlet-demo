"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createCareerHistory, updateCareerHistory, deleteCareerHistory,
  createEducationHistory, updateEducationHistory, deleteEducationHistory,
  createFamilyMember, updateFamilyMember, deleteFamilyMember,
} from "@teamlet/modules/employee";
import type {
  CareerHistoryInput, EducationHistoryInput, FamilyMemberInput,
} from "@teamlet/modules/employee";

type ApiResponse<T = void> = { ok: true; data: T } | { ok: false; error: { message: string } };

async function getEmployeeId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.employeeId ?? null;
}

function revalidate(employeeId: string) {
  revalidatePath(`/members/${employeeId}`);
}

// ── 경력 ──────────────────────────────────────────────────────

export async function createCareerHistoryAction(
  targetEmployeeId: string,
  input: CareerHistoryInput,
): Promise<ApiResponse<{ id: string }>> {
  const actorId = await getEmployeeId();
  if (!actorId) return { ok: false, error: { message: "인증이 필요해요" } };
  const result = await createCareerHistory(actorId, targetEmployeeId, input);
  if (!result.ok) return { ok: false, error: { message: result.error.message } };
  revalidate(targetEmployeeId);
  return { ok: true, data: result.data };
}

export async function updateCareerHistoryAction(
  targetEmployeeId: string,
  careerHistoryId: string,
  input: Partial<CareerHistoryInput>,
): Promise<ApiResponse> {
  const actorId = await getEmployeeId();
  if (!actorId) return { ok: false, error: { message: "인증이 필요해요" } };
  const result = await updateCareerHistory(actorId, careerHistoryId, input);
  if (!result.ok) return { ok: false, error: { message: result.error.message } };
  revalidate(targetEmployeeId);
  return { ok: true, data: undefined };
}

export async function deleteCareerHistoryAction(
  targetEmployeeId: string,
  careerHistoryId: string,
): Promise<ApiResponse> {
  const actorId = await getEmployeeId();
  if (!actorId) return { ok: false, error: { message: "인증이 필요해요" } };
  const result = await deleteCareerHistory(actorId, careerHistoryId);
  if (!result.ok) return { ok: false, error: { message: result.error.message } };
  revalidate(targetEmployeeId);
  return { ok: true, data: undefined };
}

// ── 학력 ──────────────────────────────────────────────────────

export async function createEducationHistoryAction(
  targetEmployeeId: string,
  input: EducationHistoryInput,
): Promise<ApiResponse<{ id: string }>> {
  const actorId = await getEmployeeId();
  if (!actorId) return { ok: false, error: { message: "인증이 필요해요" } };
  const result = await createEducationHistory(actorId, targetEmployeeId, input);
  if (!result.ok) return { ok: false, error: { message: result.error.message } };
  revalidate(targetEmployeeId);
  return { ok: true, data: result.data };
}

export async function updateEducationHistoryAction(
  targetEmployeeId: string,
  educationHistoryId: string,
  input: Partial<EducationHistoryInput>,
): Promise<ApiResponse> {
  const actorId = await getEmployeeId();
  if (!actorId) return { ok: false, error: { message: "인증이 필요해요" } };
  const result = await updateEducationHistory(actorId, educationHistoryId, input);
  if (!result.ok) return { ok: false, error: { message: result.error.message } };
  revalidate(targetEmployeeId);
  return { ok: true, data: undefined };
}

export async function deleteEducationHistoryAction(
  targetEmployeeId: string,
  educationHistoryId: string,
): Promise<ApiResponse> {
  const actorId = await getEmployeeId();
  if (!actorId) return { ok: false, error: { message: "인증이 필요해요" } };
  const result = await deleteEducationHistory(actorId, educationHistoryId);
  if (!result.ok) return { ok: false, error: { message: result.error.message } };
  revalidate(targetEmployeeId);
  return { ok: true, data: undefined };
}

// ── 가족 ──────────────────────────────────────────────────────

export async function createFamilyMemberAction(
  targetEmployeeId: string,
  input: FamilyMemberInput,
): Promise<ApiResponse<{ id: string }>> {
  const actorId = await getEmployeeId();
  if (!actorId) return { ok: false, error: { message: "인증이 필요해요" } };
  const result = await createFamilyMember(actorId, targetEmployeeId, input);
  if (!result.ok) return { ok: false, error: { message: result.error.message } };
  revalidate(targetEmployeeId);
  return { ok: true, data: result.data };
}

export async function updateFamilyMemberAction(
  targetEmployeeId: string,
  familyMemberId: string,
  input: Partial<FamilyMemberInput>,
): Promise<ApiResponse> {
  const actorId = await getEmployeeId();
  if (!actorId) return { ok: false, error: { message: "인증이 필요해요" } };
  const result = await updateFamilyMember(actorId, familyMemberId, input);
  if (!result.ok) return { ok: false, error: { message: result.error.message } };
  revalidate(targetEmployeeId);
  return { ok: true, data: undefined };
}

export async function deleteFamilyMemberAction(
  targetEmployeeId: string,
  familyMemberId: string,
): Promise<ApiResponse> {
  const actorId = await getEmployeeId();
  if (!actorId) return { ok: false, error: { message: "인증이 필요해요" } };
  const result = await deleteFamilyMember(actorId, familyMemberId);
  if (!result.ok) return { ok: false, error: { message: result.error.message } };
  revalidate(targetEmployeeId);
  return { ok: true, data: undefined };
}
