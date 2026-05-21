"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CandidateResult } from "@teamlet/modules/recruit";
import { moveCandidateStageAction, setCandidateResultAction } from "@/lib/actions/recruit";

const RESULTS: { value: CandidateResult; label: string }[] = [
  { value: "IN_PROGRESS", label: "진행중" },
  { value: "PASSED", label: "합격" },
  { value: "FAILED", label: "불합격" },
  { value: "WITHDRAWN", label: "사퇴" },
];

export function CandidateActions({
  candidateId,
  stages,
  currentResult,
}: {
  candidateId: string;
  stages: { id: string; name: string }[];
  currentResult: CandidateResult;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleStageChange(stageId: string) {
    startTransition(async () => {
      await moveCandidateStageAction(candidateId, stageId);
      router.refresh();
    });
  }

  function handleResultChange(result: CandidateResult) {
    startTransition(async () => {
      await setCandidateResultAction(candidateId, result);
      router.refresh();
    });
  }

  const selectClass = "h-8 rounded-md border border-border bg-background-primary px-2 text-sm text-foreground focus-visible:border-border-focus focus-visible:outline-none disabled:opacity-50";

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
      {stages.length > 0 && (
        <select
          disabled={isPending || currentResult !== "IN_PROGRESS"}
          onChange={(e) => handleStageChange(e.target.value)}
          defaultValue=""
          className={selectClass}
        >
          <option value="" disabled>단계 이동</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}
      <select
        disabled={isPending}
        value={currentResult}
        onChange={(e) => handleResultChange(e.target.value as CandidateResult)}
        className={selectClass}
      >
        {RESULTS.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
    </div>
  );
}
