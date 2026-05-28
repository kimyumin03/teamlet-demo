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
import type { AutoGrantResult } from "@teamlet/modules/leave";
import { runAnnualLeaveGrantAction } from "@/lib/actions/leave-policy";

export function AutoGrantButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [result, setResult] = useState<AutoGrantResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setYear(new Date().getFullYear());
    setResult(null);
    setError(null);
  }

  function handleRun() {
    setError(null);
    startTransition(async () => {
      const res = await runAnnualLeaveGrantAction(year);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setResult(res.data);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (isPending) return;
        setOpen(o);
        if (o) reset();
      }}
    >
      <Button onClick={() => setOpen(true)}>연차 자동부여 실행</Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>연차 자동부여</DialogTitle>
          <DialogDescription>
            정책이 배정된 구성원에게 휴가 유형의 기준 일수를 부여해요. 입사 첫 해는
            월할 비례 적용. 같은 해에 다시 실행해도 중복 부여되지 않아요.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-md border border-border bg-background-secondary px-4 py-3">
              <p className="text-sm font-medium text-foreground">
                {result.year}년 연차 자동부여 완료
              </p>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-foreground-muted">
                <li>
                  부여 —{" "}
                  <strong className="text-foreground">
                    {result.grantedCount}명 · {result.grantedDays}일
                  </strong>
                </li>
                <li>이미 부여됨 — {result.alreadyGrantedCount}명 (건너뜀)</li>
                <li>부여량 미설정 — {result.skippedNoAmountCount}명 (건너뜀)</li>
                <li>정책 미배정 — {result.noPolicyCount}명 (대상 아님)</li>
              </ul>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">닫기</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="grant-year" className="text-sm text-foreground-muted">
                부여 연도
              </label>
              <Input
                id="grant-year"
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-32"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-[14px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive"
              >
                {error}
              </p>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isPending}>
                  취소
                </Button>
              </DialogClose>
              <Button
                type="button"
                onClick={handleRun}
                disabled={isPending || !Number.isInteger(year)}
              >
                {isPending ? "실행 중…" : "실행"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
