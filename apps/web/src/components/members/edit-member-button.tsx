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
import type { EmployeeDetail } from "@teamlet/modules/employee";
import { updateEmployeeAction } from "@/lib/actions/employee";

function toDateInput(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export function EditMemberButton({
  employee,
  departments,
}: {
  employee: EmployeeDetail;
  departments: DepartmentNode[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(employee.name);
  const [employeeNumber, setEmployeeNumber] = useState(
    employee.employeeNumber ?? "",
  );
  const [companyEmail, setCompanyEmail] = useState(
    employee.companyEmail ?? "",
  );
  const [personalEmail, setPersonalEmail] = useState(
    employee.personalEmail ?? "",
  );
  const [hireDate, setHireDate] = useState(toDateInput(employee.hireDate));
  const [departmentId, setDepartmentId] = useState(
    employee.departmentId ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateEmployeeAction(employee.id, {
        name,
        employeeNumber: employeeNumber || undefined,
        companyEmail: companyEmail || undefined,
        personalEmail: personalEmail || undefined,
        hireDate: hireDate || undefined,
        departmentId: departmentId || undefined,
      });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!isPending) setOpen(o);
      }}
    >
      <Button variant="secondary" onClick={() => setOpen(true)}>
        수정
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>구성원 정보 수정</DialogTitle>
          <DialogDescription>
            비워두면 해당 필드가 지워져요. 이름은 필수예요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-name"
              className="text-sm text-foreground-muted"
            >
              이름
            </label>
            <Input
              id="edit-name"
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
                htmlFor="edit-number"
                className="text-sm text-foreground-muted"
              >
                사번
              </label>
              <Input
                id="edit-number"
                maxLength={30}
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-hire"
                className="text-sm text-foreground-muted"
              >
                입사일
              </label>
              <Input
                id="edit-hire"
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-email"
              className="text-sm text-foreground-muted"
            >
              회사 이메일
            </label>
            <Input
              id="edit-email"
              type="email"
              maxLength={254}
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-personal-email"
              className="text-sm text-foreground-muted"
            >
              개인 이메일
            </label>
            <Input
              id="edit-personal-email"
              type="email"
              maxLength={254}
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-dept"
              className="text-sm text-foreground-muted"
            >
              부서
            </label>
            <select
              id="edit-dept"
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
              {isPending ? "저장 중…" : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
