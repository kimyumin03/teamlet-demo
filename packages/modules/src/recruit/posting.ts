import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { loadActor } from "../permission/_actor";
import type { PostingListItem, PostingDetail, CreatePostingInput } from "./types";

export async function listPostings(
  actorEmployeeId: string,
): Promise<Result<PostingListItem[]>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const postings = await prisma.jobPosting.findMany({
    where: { companyId: actor.companyId },
    include: {
      manager: { select: { name: true } },
      _count: { select: { candidates: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return ok(
    postings.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      managerName: p.manager.name,
      candidateCount: p._count.candidates,
      createdAt: p.createdAt,
    })),
  );
}

export async function getPosting(
  actorEmployeeId: string,
  postingId: string,
): Promise<Result<PostingDetail>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const p = await prisma.jobPosting.findUnique({
    where: { id: postingId },
    include: {
      manager: { select: { name: true } },
      stages: { orderBy: { order: "asc" } },
      candidates: {
        include: { currentStage: { select: { name: true } } },
        orderBy: { appliedAt: "desc" },
      },
    },
  });

  if (!p || p.companyId !== actor.companyId) return err(errors.notFound("공고를 찾을 수 없어요"));

  return ok({
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    managerName: p.manager.name,
    createdAt: p.createdAt,
    stages: p.stages.map((s) => ({ id: s.id, order: s.order, name: s.name })),
    candidates: p.candidates.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      currentStageName: c.currentStage?.name ?? null,
      result: c.result,
      appliedAt: c.appliedAt,
    })),
  });
}

export async function createPosting(
  input: CreatePostingInput,
): Promise<Result<{ id: string }>> {
  if (!input.title.trim()) return err(errors.validation("공고 제목을 입력해 주세요"));

  const posting = await prisma.$transaction(async (tx) => {
    const created = await tx.jobPosting.create({
      data: {
        companyId: input.companyId,
        managerId: input.managerId,
        title: input.title,
        description: input.description ?? "",
        status: "OPEN",
      },
      select: { id: true },
    });

    if (input.stages.length > 0) {
      await tx.jobStage.createMany({
        data: input.stages.map((name, idx) => ({
          postingId: created.id,
          order: idx + 1,
          name,
        })),
      });
    }

    return created;
  });

  return ok(posting);
}

export async function updatePostingStatus(
  actorEmployeeId: string,
  postingId: string,
  status: "OPEN" | "CLOSED" | "CANCELLED",
): Promise<Result<void>> {
  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const posting = await prisma.jobPosting.findUnique({
    where: { id: postingId },
    select: { companyId: true },
  });
  if (!posting || posting.companyId !== actor.companyId)
    return err(errors.notFound("공고를 찾을 수 없어요"));

  await prisma.jobPosting.update({ where: { id: postingId }, data: { status } });
  return ok(undefined);
}
