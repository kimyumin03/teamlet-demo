"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pin } from "lucide-react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@teamlet/ui";
import { createAnnouncementAction } from "@/lib/actions/announcement";

export function CreateAnnouncementButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setTitle("");
    setContent("");
    setIsPinned(false);
    setError(null);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const res = await createAnnouncementAction({ title, content, isPinned });
      if (res.ok) {
        setOpen(false);
        reset();
        router.refresh();
      } else {
        setError(res.error?.message ?? "오류가 발생했어요");
      }
    });
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => { reset(); setOpen(true); }}
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        공지 작성
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!isPending) { setOpen(o); if (!o) reset(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공지사항 작성</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground-muted">제목</label>
              <input
                className="w-full rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle outline-none focus:border-foreground-subtle transition-colors"
                placeholder="공지사항 제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground-muted">내용</label>
              <textarea
                className="w-full rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle outline-none focus:border-foreground-subtle transition-colors resize-none"
                placeholder="공지 내용을 입력해 주세요"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isPending}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setIsPinned((p) => !p)}
                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                  isPinned
                    ? "border-foreground bg-foreground"
                    : "border-border bg-background-primary"
                }`}
              >
                {isPinned && <Pin className="h-2.5 w-2.5 text-background-primary" />}
              </div>
              <span className="text-sm text-foreground-muted">상단 고정</span>
            </label>

            {error && (
              <p className="text-xs text-destructive-700">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" disabled={isPending} onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button disabled={isPending || !title.trim() || !content.trim()} onClick={handleSubmit}>
              {isPending ? "등록 중…" : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
