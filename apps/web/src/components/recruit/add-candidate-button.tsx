"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from "@teamlet/ui";
import { createCandidateAction } from "@/lib/actions/recruit";

export function AddCandidateButton({
  postingId,
  stages,
}: {
  postingId: string;
  stages: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() { setName(""); setEmail(""); setPhone(""); setError(null); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createCandidateAction({ postingId, name, email, phone: phone || undefined });
      if (!res.ok) { setError(res.error.message); return; }
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (isPending) return; if (!o) reset(); setOpen(o); }}>
      <Button variant="secondary" onClick={() => setOpen(true)}>+ 후보자 추가</Button>
      <DialogContent>
        <DialogHeader><DialogTitle>후보자 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-foreground-muted">이름</label>
            <Input required maxLength={50} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-foreground-muted">이메일</label>
            <Input required type="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-foreground-muted">연락처 (선택)</label>
            <Input maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
          </div>
          {stages.length > 0 && (
            <p className="text-xs text-foreground-subtle">첫 단계({stages[0]?.name})로 자동 배정돼요.</p>
          )}
          {error && <p role="alert" className="rounded-md bg-destructive-50 px-3 py-2 text-sm text-destructive-700">{error}</p>}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary" disabled={isPending}>취소</Button></DialogClose>
            <Button type="submit" disabled={isPending || !name.trim() || !email.trim()}>
              {isPending ? "추가 중…" : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
