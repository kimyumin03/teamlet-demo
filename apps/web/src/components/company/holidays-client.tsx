"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@teamlet/ui";
import type { HolidayItem } from "@teamlet/modules/tenancy";
import { addCompanyHolidayAction, deleteCompanyHolidayAction } from "@/lib/actions/company";

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

export function HolidaysClient({ initialHolidays, year }: { initialHolidays: HolidayItem[]; year: number }) {
  const router = useRouter();
  const [holidays, setHolidays] = useState(initialHolidays);
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [isNational, setIsNational] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await addCompanyHolidayAction({ date, name, isNational });
      if (!res.ok) { setError(res.error.message); return; }
      setDate("");
      setName("");
      setIsNational(false);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteCompanyHolidayAction(id);
      if (!res.ok) { setError(res.error.message); return; }
      setHolidays((prev) => prev.filter((h) => h.id !== id));
    });
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col gap-6">
      {/* 연도 선택 */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => router.push(`/settings/holidays?year=${year - 1}`)}
        >
          ‹ {year - 1}
        </Button>
        <span className="px-4 text-sm font-medium text-foreground">{year}년</span>
        <Button
          variant="secondary"
          onClick={() => router.push(`/settings/holidays?year=${year + 1}`)}
        >
          {year + 1} ›
        </Button>
      </div>

      {/* 추가 폼 */}
      <form onSubmit={handleAdd} className="rounded-lg border border-border bg-background-primary p-4">
        <p className="mb-3 text-sm font-medium text-foreground">공휴일 추가</p>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={`${year}-01-01`}
              max={`${year}-12-31`}
            />
            <Input
              required
              maxLength={50}
              placeholder="공휴일 이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={isNational}
              onChange={(e) => setIsNational(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            법정공휴일
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive-600">{error}</p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending || !date || !name.trim()}>
              {isPending ? "추가 중…" : "추가"}
            </Button>
          </div>
        </div>
      </form>

      {/* 목록 */}
      {holidays.length === 0 ? (
        <div className="rounded-lg border border-border bg-background-primary p-8 text-center text-sm text-foreground-muted">
          {year}년에 등록된 공휴일이 없어요.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-background-primary">
          {holidays.map((h) => (
            <div key={h.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="text-sm font-medium text-foreground">{h.name}</span>
                {h.isNational && (
                  <span className="ml-2 rounded-full bg-primary-100 px-1.5 py-0.5 text-xs text-primary-700">법정</span>
                )}
                <p className="mt-0.5 text-xs text-foreground-muted">{formatDate(h.date)}</p>
              </div>
              <Button
                variant="destructive"
                onClick={() => handleDelete(h.id)}
                disabled={isPending}
              >
                삭제
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
