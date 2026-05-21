import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { loadActor } from "../permission/_actor";
import type { CreateCandidateInput, CandidateResult } from "./types";

export async function createCandidate(
  input: CreateCandidateInput,
): Promise<Result<{ id: string }>> {
  const posting = await prisma.jobPosting.findUnique({
    where: { id: input.postingId },
    include: { stages: { orderBy: { order: "asc" }, take: 1 } },
  });
  if (!posting) return err(errors.notFound("공고를 찾을 수 없어요"));

  const candidate = await prisma.candidate.create({
    data: {
      postingId: input.postingId,
      managerId: input.managerId ?? null,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      currentStageId: posting.stages[0]?.id ?? null,
    },
    select: { id: true },
  });

  return ok(candidate);
}

export async function moveCandidateStage(
  actorEmployeeId: string,
  candidateId: string,
  stageId: string,
): Promise<Result<void>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { posting: { select: { companyId: true } } },
  });
  if (!candidate || candidate.posting.companyId !== actor.companyId)
    return err(errors.notFound("후보자를 찾을 수 없어요"));

  const stage = await prisma.jobStage.findUnique({ where: { id: stageId } });
  if (!stage || stage.postingId !== candidate.postingId)
    return err(errors.validation("올바른 전형 단계가 아니에요"));

  await prisma.candidate.update({ where: { id: candidateId }, data: { currentStageId: stageId } });
  return ok(undefined);
}

export async function setCandidateResult(
  actorEmployeeId: string,
  candidateId: string,
  result: CandidateResult,
): Promise<Result<void>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { posting: { select: { companyId: true } } },
  });
  if (!candidate || candidate.posting.companyId !== actor.companyId)
    return err(errors.notFound("후보자를 찾을 수 없어요"));

  await prisma.candidate.update({ where: { id: candidateId }, data: { result } });
  return ok(undefined);
}
