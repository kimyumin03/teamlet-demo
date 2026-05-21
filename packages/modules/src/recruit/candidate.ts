import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { loadActor } from "../permission/_actor";
import type { CreateCandidateInput, CandidateResult, CandidateDetail } from "./types";

export async function getCandidate(
  actorEmployeeId: string,
  candidateId: string,
): Promise<Result<CandidateDetail>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const c = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      currentStage: { select: { id: true, name: true } },
      posting: {
        select: {
          id: true,
          title: true,
          companyId: true,
          stages: { orderBy: { order: "asc" }, select: { id: true, order: true, name: true } },
        },
      },
    },
  });

  if (!c || c.posting.companyId !== actor.companyId) {
    return err(errors.notFound("후보자를 찾을 수 없어요"));
  }

  const answers = (c.answers ?? {}) as Record<string, unknown>;

  return ok({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    result: c.result,
    currentStageId: c.currentStageId,
    currentStageName: c.currentStage?.name ?? null,
    note: typeof answers.note === "string" ? answers.note : "",
    appliedAt: c.appliedAt,
    updatedAt: c.updatedAt,
    posting: {
      id: c.posting.id,
      title: c.posting.title,
      stages: c.posting.stages,
    },
  });
}

export async function updateCandidateNote(
  actorEmployeeId: string,
  candidateId: string,
  note: string,
): Promise<Result<void>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { posting: { select: { companyId: true } } },
  });
  if (!candidate || candidate.posting.companyId !== actor.companyId) {
    return err(errors.notFound("후보자를 찾을 수 없어요"));
  }

  const existing = (candidate.answers ?? {}) as Record<string, unknown>;
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { answers: { ...existing, note } },
  });

  return ok(undefined);
}

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
