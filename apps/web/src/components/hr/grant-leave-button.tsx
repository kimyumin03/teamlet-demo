"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@teamlet/ui";
import { grantLeaveAction } from "@/lib/actions/leave";

type Employee = { id: string; name: string; departmentName: string | null };
type LeaveType = { id: string; name: string };

export function GrantLeaveButton({
  employees,
  leaveTypes,
}: {
  employees: Employee[];
  leaveTypes: LeaveType[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [days, setDays] = useState<number | "">(1);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setEmployeeId("");
    setLeaveTypeId("");
    setDays(1);
    setReason("");
    setError(null);
  }

  function handleSubmit() {
    if (!employeeId || !leaveTypeId || !days) return;
    setError(null);
    startTransition(async () => {
      const res = await grantLeaveAction({
        employeeId,
        leaveTypeId,
        days: Number(days),
        reason: reason.trim() || undefined,
      });
      if (res.ok) {
        setOpen(false);
        reset();
        router.refresh();
      } else {
        setError(res.error?.message ?? "오류가 발생했어요");
      }
    });
  }

  const isValid = !!employeeId && !!leaveTypeId && Number(days) > 0;

  return (
    <>
      <Button onClick={() => { reset(); setOpen(true); }}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        맞춤 휴가 부여
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!isPending) { setOpen(o); if (!o) reset(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>맞춤 휴가 부여</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground-muted">대상자</label>
              <select
                className="w-full rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-subtle"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={isPending}
              >
                <option value="">구성원 선택</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}{emp.departmentName ? ` (${emp.departmentName})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground-muted">휴가 종류</label>
              <select
                className="w-full rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-subtle"
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
                disabled={isPending}
              >
                <option value="">종류 선택</option>
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>{lt.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground-muted">부여 일수</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  className="w-28 rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-foreground outline-none focus:border-foreground-subtle"
                  value={days}
                  onChange={(e) => setDays(e.target.value === "" ? "" : Number(e.target.value))}
                  disabled={isPending}
                />
                <span className="text-sm text-foreground-muted">일</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-foreground-muted">사유 <span className="text-foreground-subtle">(선택)</span></label>
              <input
                className="w-full rounded-lg border border-border bg-background-primary px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle outline-none focus:border-foreground-subtle"
                placeholder="부여 사유"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isPending}
              />
            </div>

            {error && <p className="text-xs text-destructive-700">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="secondary" disabled={isPending} onClick={() => setOpen(false)}>취소</Button>
            <Button disabled={isPending || !isValid} onClick={handleSubmit}>
              {isPending ? "부여 중…" : "휴가 부여"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
