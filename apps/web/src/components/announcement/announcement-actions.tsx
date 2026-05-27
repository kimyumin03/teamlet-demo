"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Pin, PinOff } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Button } from "@teamlet/ui";
import { updateAnnouncementAction, deleteAnnouncementAction, togglePinAction } from "@/lib/actions/announcement";

type Props = {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
};

export function AnnouncementActions({ id, title, content, isPinned }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editContent, setEditContent] = useState(content);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleEdit() {
    setEditTitle(title);
    setEditContent(content);
    setError(null);
    setOpen(false);
    setEditOpen(true);
  }

  function handleUpdate() {
    if (!editTitle.trim() || !editContent.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await updateAnnouncementAction(id, { title: editTitle, content: editContent });
      if (res.ok) {
        setEditOpen(false);
        router.refresh();
      } else {
        setError(res.error?.message ?? "오류가 발생했어요");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteAnnouncementAction(id);
      setOpen(false);
      router.refresh();
    });
  }

  function handleTogglePin() {
    startTransition(async () => {
      await togglePinAction(id);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-subtle hover:bg-background-secondary hover:text-foreground transition-colors"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-8 z-20 w-36 rounded-lg border border-border bg-background-primary py-1 shadow-lg">
              <button
                onClick={handleEdit}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-background-secondary transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" /> 수정
              </button>
              <button
                onClick={handleTogglePin}
                disabled={isPending}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-background-secondary transition-colors disabled:opacity-50"
              >
                {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                {isPinned ? "고정 해제" : "상단 고정"}
              </button>
              <div className="my-1 border-t border-border" />
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive-600 hover:bg-destructive-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> 삭제
              </button>
            </div>
          </>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={(o) => { if (!isPending) setEditOpen(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공지사항 수정</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground-muted">제목</label>
              <input
                className="w-full rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-subtle"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground-muted">내용</label>
              <textarea
                rows={5}
                className="w-full resize-none rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-subtle"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                disabled={isPending}
              />
            </div>
            {error && <p className="text-xs text-destructive-700">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="secondary" disabled={isPending} onClick={() => setEditOpen(false)}>취소</Button>
            <Button disabled={isPending || !editTitle.trim() || !editContent.trim()} onClick={handleUpdate}>
              {isPending ? "저장 중…" : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
