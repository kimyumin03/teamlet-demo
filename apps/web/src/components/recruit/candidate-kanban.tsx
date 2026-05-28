"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CandidateListItem, CandidateResult } from "@teamlet/modules/recruit";
import { moveCandidateStageAction, setCandidateResultAction } from "@/lib/actions/recruit";

const RESULT_LABEL: Record<CandidateResult, string> = {
  IN_PROGRESS: "진행중", PASSED: "합격", FAILED: "불합격", WITHDRAWN: "사퇴",
};
const RESULT_CLASS: Record<CandidateResult, string> = {
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  PASSED: "bg-green-50 text-green-700",
  FAILED: "bg-destructive/5 text-destructive",
  WITHDRAWN: "bg-background-secondary text-foreground-subtle",
};

function CandidateCard({
  candidate,
  stages,
  postingId,
}: {
  candidate: CandidateListItem;
  stages: { id: string; name: string }[];
  postingId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleStageChange(stageId: string) {
    startTransition(async () => {
      await moveCandidateStageAction(candidate.id, stageId);
      router.refresh();
    });
  }

  function handleResultChange(result: CandidateResult) {
    startTransition(async () => {
      await setCandidateResultAction(candidate.id, result);
      router.refresh();
    });
  }

  return (
    <div className={`rounded-lg border border-border bg-background-primary p-3 ${isPending ? "opacity-50" : ""}`}>
      <Link
        href={`/recruit/postings/${postingId}/candidates/${candidate.id}`}
        className="hover:underline"
      >
        <p className="font-medium text-foreground text-sm">{candidate.name}</p>
        <p className="text-xs text-foreground-muted truncate">{candidate.email}</p>
      </Link>
      <div className="mt-2 flex flex-col gap-1.5">
        {stages.length > 0 && (
          <select
            disabled={isPending || candidate.result !== "IN_PROGRESS"}
            onChange={(e) => handleStageChange(e.target.value)}
            defaultValue=""
            className="h-7 w-full rounded border border-border bg-background-secondary px-2 text-xs text-foreground focus-visible:outline-none disabled:opacity-50"
          >
            <option value="" disabled>단계 이동</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
        <select
          disabled={isPending}
          value={candidate.result}
          onChange={(e) => handleResultChange(e.target.value as CandidateResult)}
          className="h-7 w-full rounded border border-border bg-background-secondary px-2 text-xs text-foreground focus-visible:outline-none disabled:opacity-50"
        >
          {(["IN_PROGRESS", "PASSED", "FAILED", "WITHDRAWN"] as CandidateResult[]).map((r) => (
            <option key={r} value={r}>{RESULT_LABEL[r]}</option>
          ))}
        </select>
      </div>
      <span className={`mt-2 inline-flex rounded px-1.5 py-0.5 text-[10px] ${RESULT_CLASS[candidate.result]}`}>
        {RESULT_LABEL[candidate.result]}
      </span>
    </div>
  );
}

export function CandidateKanban({
  stages,
  candidates,
  postingId,
}: {
  stages: { id: string; order: number; name: string }[];
  candidates: CandidateListItem[];
  postingId: string;
}) {
  // 단계별 그룹핑 + 미배정 컬럼
  const unassigned = candidates.filter((c) => !c.currentStageName);
  const columns = [
    ...stages.map((s) => ({
      id: s.id,
      name: s.name,
      items: candidates.filter((c) => c.currentStageName === s.name),
    })),
    ...(unassigned.length > 0
      ? [{ id: "__none__", name: "미배정", items: unassigned }]
      : []),
  ];

  if (columns.length === 0) {
    return <p className="text-sm text-foreground-muted">전형 단계가 없어요.</p>;
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div key={col.id} className="w-56 shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">{col.name}</span>
            <span className="rounded-full bg-background-secondary px-1.5 py-0.5 text-[10px] text-foreground-subtle">
              {col.items.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {col.items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-foreground-subtle">
                없음
              </div>
            ) : (
              col.items.map((c) => (
                <CandidateCard key={c.id} candidate={c} stages={stages} postingId={postingId} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
