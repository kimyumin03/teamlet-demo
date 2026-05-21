"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@teamlet/ui";
import type { LeaveTypeItem } from "@teamlet/modules/leave";
import { requestLeaveAction } from "@/lib/actions/leave";

export function LeaveRequestButton({ leaveTypes }: { leaveTypes: LeaveTypeItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setLeaveTypeId("");
    setStartDate("");
    setEndDate("");
    setDays("");
    setReason("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const daysNum = parseFloat(days);
    if (!daysNum || daysNum <= 0) {
      setError("올바른 일수를 입력해 주세요");
      return;
    }
    startTransition(async () => {
      const res = await requestLeaveAction({
        leaveTypeId,
        startDate,
        endDate,
        days: daysNum,
        reason: reason || undefined,
      });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (isPending) return;
        if (!o) reset();
        setOpen(o);
      }}
    >
      <Button onClick={() => setOpen(true)}>+ 휴가 신청</Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>휴가 신청</DialogTitle>
          <DialogDescription>신청 후 관리자 승인이 필요해요.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="leave-type" className="text-sm text-foreground-muted">
              휴가 종류
            </label>
            <select
              id="leave-type"
              required
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
              className="h-10 rounded-md border border-border bg-background-primary px-3 text-base text-foreground focus-visible:border-border-focus focus-visible:shadow-focus focus-visible:outline-none"
            >
              <option value="">선택해 주세요</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.grantAmount ? ` (최대 ${t.grantAmount}일)` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="leave-start" className="text-sm text-foreground-muted">
                시작일
              </label>
              <Input
                id="leave-start"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="leave-end" className="text-sm text-foreground-muted">
                종료일
              </label>
              <Input
                id="leave-end"
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="leave-days" className="text-sm text-foreground-muted">
              사용 일수
            </label>
            <Input
              id="leave-days"
              type="number"
              required
              min="0.5"
              max="365"
              step="0.5"
              placeholder="예: 1, 0.5"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="leave-reason" className="text-sm text-foreground-muted">
              사유 (선택)
            </label>
            <Input
              id="leave-reason"
              maxLength={200}
              placeholder="예: 개인 사정"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-destructive-50 px-3 py-2 text-sm text-destructive-700">
              {error}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isPending}>
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || !leaveTypeId || !startDate || !endDate || !days}>
              {isPending ? "신청 중…" : "신청"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
