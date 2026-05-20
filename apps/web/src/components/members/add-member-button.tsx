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
import type { DepartmentNode } from "@teamlet/modules/department";
import { createEmployeeAction } from "@/lib/actions/employee";

export function AddMemberButton({
  departments,
  defaultDepartmentId,
}: {
  departments: DepartmentNode[];
  /** URL 에 선택된 부서 — Dialog 초기값에 미리 채움 (UX 편의) */
  defaultDepartmentId?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setEmployeeNumber("");
    setCompanyEmail("");
    setHireDate("");
    setDepartmentId(defaultDepartmentId ?? "");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createEmployeeAction({
        name,
        employeeNumber: employeeNumber || undefined,
        companyEmail: companyEmail || undefined,
        hireDate: hireDate || undefined,
        departmentId: departmentId || undefined,
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
      <Button onClick={() => setOpen(true)}>+ 구성원 추가</Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>구성원 추가</DialogTitle>
          <DialogDescription>
            이름만 필수예요. 사번/이메일/입사일은 나중에 채울 수 있어요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="emp-name" className="text-sm text-foreground-muted">
              이름
            </label>
            <Input
              id="emp-name"
              required
              minLength={2}
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="emp-number"
                className="text-sm text-foreground-muted"
              >
                사번 (선택)
              </label>
              <Input
                id="emp-number"
                maxLength={30}
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="emp-hire"
                className="text-sm text-foreground-muted"
              >
                입사일 (선택)
              </label>
              <Input
                id="emp-hire"
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="emp-email"
              className="text-sm text-foreground-muted"
            >
              회사 이메일 (선택)
            </label>
            <Input
              id="emp-email"
              type="email"
              maxLength={254}
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="emp-department"
              className="text-sm text-foreground-muted"
            >
              부서 (선택)
            </label>
            <select
              id="emp-department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="h-10 rounded-md border border-border bg-background-primary px-3 text-base text-foreground focus-visible:border-border-focus focus-visible:shadow-focus focus-visible:outline-none"
            >
              <option value="">미배정</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md bg-destructive-50 px-3 py-2 text-sm text-destructive-700"
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
            <Button type="submit" disabled={isPending || name.trim().length < 2}>
              {isPending ? "추가 중…" : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
