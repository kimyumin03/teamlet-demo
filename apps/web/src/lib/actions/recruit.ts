"use server";

import { redirect } from "next/navigation";
import { prisma } from "@teamlet/db";
import { createPosting, updatePostingStatus, createCandidate, updateCandidateNote, moveCandidateStage, setCandidateResult } from "@teamlet/modules/recruit";
import type { CandidateResult } from "@teamlet/modules/recruit";
import { toApiResponse, type ApiResponse } from "@teamlet/shared";
import { auth } from "@/auth";

async function requireEmployee(): Promise<{ employeeId: string; companyId: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");
  const emp = await prisma.employee.findUnique({
    where: { id: session.user.employeeId },
    select: { companyId: true },
  });
  if (!emp) redirect("/join-company");
  return { employeeId: session.user.employeeId, companyId: emp.companyId };
}

export async function createPostingAction(input: {
  title: string;
  description?: string;
  stages: string[];
}): Promise<ApiResponse<{ id: string }>> {
  const { employeeId, companyId } = await requireEmployee();
  return toApiResponse(
    await createPosting({ companyId, managerId: employeeId, ...input }),
  );
}

export async function updatePostingStatusAction(
  postingId: string,
  status: "OPEN" | "CLOSED" | "CANCELLED",
): Promise<ApiResponse<void>> {
  const { employeeId } = await requireEmployee();
  return toApiResponse(await updatePostingStatus(employeeId, postingId, status));
}

export async function createCandidateAction(input: {
  postingId: string;
  name: string;
  email: string;
  phone?: string;
}): Promise<ApiResponse<{ id: string }>> {
  const { employeeId } = await requireEmployee();
  return toApiResponse(await createCandidate({ ...input, managerId: employeeId }));
}

export async function moveCandidateStageAction(
  candidateId: string,
  stageId: string,
): Promise<ApiResponse<void>> {
  const { employeeId } = await requireEmployee();
  return toApiResponse(await moveCandidateStage(employeeId, candidateId, stageId));
}

export async function setCandidateResultAction(
  candidateId: string,
  result: CandidateResult,
): Promise<ApiResponse<void>> {
  const { employeeId } = await requireEmployee();
  return toApiResponse(await setCandidateResult(employeeId, candidateId, result));
}

export async function updateCandidateNoteAction(
  candidateId: string,
  note: string,
): Promise<ApiResponse<void>> {
  const { employeeId } = await requireEmployee();
  return toApiResponse(await updateCandidateNote(employeeId, candidateId, note));
}
