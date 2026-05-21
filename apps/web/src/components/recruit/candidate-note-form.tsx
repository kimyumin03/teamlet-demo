"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { updateCandidateNoteAction } from "@/lib/actions/recruit";

export function CandidateNoteForm({
  candidateId,
  initialNote,
}: {
  candidateId: string;
  initialNote: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState(initialNote);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateCandidateNoteAction(candidateId, note);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={note}
        onChange={(e) => { setNote(e.target.value); setSaved(false); }}
        placeholder="후보자에 대한 메모를 입력하세요…"
        rows={5}
        className="w-full resize-none rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-1 focus:ring-border"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="h-8 rounded-md bg-foreground px-4 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "저장 중…" : "저장"}
        </button>
        {saved && <span className="text-xs text-foreground-muted">저장됐어요</span>}
      </div>
    </div>
  );
}
