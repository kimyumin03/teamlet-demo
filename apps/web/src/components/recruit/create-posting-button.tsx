"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input } from "@teamlet/ui";
import { createPostingAction } from "@/lib/actions/recruit";

const DEFAULT_STAGES = ["서류", "1차 면접", "최종 면접"];

export function CreatePostingButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stages, setStages] = useState<string[]>(DEFAULT_STAGES);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() { setTitle(""); setDescription(""); setStages(DEFAULT_STAGES); setError(null); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createPostingAction({ title, description: description || undefined, stages: stages.filter(Boolean) });
      if (!res.ok) { setError(res.error.message); return; }
      reset();
      setOpen(false);
      router.push(`/recruit/postings/${res.data.id}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (isPending) return; if (!o) reset(); setOpen(o); }}>
      <Button onClick={() => setOpen(true)}>+ 공고 만들기</Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>채용 공고 만들기</DialogTitle>
          <DialogDescription>제목과 전형 단계를 설정해 주세요.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-foreground-muted">공고 제목</label>
            <Input required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 백엔드 개발자 (경력)" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-foreground-muted">설명 (선택)</label>
            <textarea
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="직무 소개, 지원 자격 등"
              className="w-full rounded-md border border-border bg-background-primary px-3 py-2 text-base text-foreground placeholder:text-foreground-subtle focus-visible:border-border-focus focus-visible:outline-none focus-visible:shadow-focus resize-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-foreground-muted">전형 단계</label>
            {stages.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-5 text-center text-xs text-foreground-subtle">{idx + 1}</span>
                <Input
                  value={s}
                  maxLength={30}
                  onChange={(e) => setStages((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))}
                />
                {stages.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setStages((prev) => prev.filter((_, i) => i !== idx))}>×</Button>
                )}
              </div>
            ))}
            {stages.length < 6 && (
              <Button type="button" variant="secondary" size="sm" onClick={() => setStages((p) => [...p, ""])}>+ 단계 추가</Button>
            )}
          </div>
          {error && <p role="alert" className="rounded-md bg-destructive-50 px-3 py-2 text-sm text-destructive-700">{error}</p>}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary" disabled={isPending}>취소</Button></DialogClose>
            <Button type="submit" disabled={isPending || !title.trim()}>{isPending ? "생성 중…" : "만들기"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
