"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@teamlet/ui";
import type { CompanyInfo } from "@teamlet/modules/tenancy";
import { updateCompanyInfoAction } from "@/lib/actions/company";

function toDateInput(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-foreground-muted">{label}</label>
      {children}
    </div>
  );
}

export function CompanyInfoForm({ initialInfo }: { initialInfo: CompanyInfo }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(initialInfo.name);
  const [phone, setPhone] = useState(initialInfo.phone ?? "");
  const [foundedAt, setFoundedAt] = useState(toDateInput(initialInfo.foundedAt));
  const [addressRoad, setAddressRoad] = useState(initialInfo.addressRoad ?? "");
  const [addressDetail, setAddressDetail] = useState(initialInfo.addressDetail ?? "");
  const [visionMission, setVisionMission] = useState(initialInfo.visionMission ?? "");
  const [companyCodeActive, setCompanyCodeActive] = useState(initialInfo.companyCodeActive);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await updateCompanyInfoAction({
        name: name.trim() || undefined,
        phone: phone.trim() || null,
        foundedAt: foundedAt || null,
        addressRoad: addressRoad.trim() || null,
        addressDetail: addressDetail.trim() || null,
        visionMission: visionMission.trim() || null,
        companyCodeActive,
      });
      if (!res.ok) { setError(res.error.message); return; }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 읽기 전용 정보 */}
      <div className="rounded-lg border border-border bg-background-secondary p-4">
        <p className="mb-3 text-xs font-medium text-foreground-muted uppercase tracking-wide">읽기 전용</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-foreground-subtle">사업자번호</p>
            <p className="mt-0.5 font-mono text-foreground">{initialInfo.businessNumber}</p>
          </div>
          <div>
            <p className="text-foreground-subtle">회사코드</p>
            <p className="mt-0.5 font-mono text-foreground">{initialInfo.companyCode}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="회사명">
          <Input
            required
            minLength={2}
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="대표 연락처">
          <Input
            maxLength={20}
            placeholder="02-0000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
      </div>

      <Field label="설립일">
        <Input type="date" value={foundedAt} onChange={(e) => setFoundedAt(e.target.value)} />
      </Field>

      <Field label="도로명 주소">
        <Input
          maxLength={200}
          placeholder="서울특별시 강남구 테헤란로 123"
          value={addressRoad}
          onChange={(e) => setAddressRoad(e.target.value)}
        />
      </Field>

      <Field label="상세 주소">
        <Input
          maxLength={200}
          placeholder="4층 401호"
          value={addressDetail}
          onChange={(e) => setAddressDetail(e.target.value)}
        />
      </Field>

      <Field label="비전·미션">
        <textarea
          maxLength={2000}
          rows={4}
          className="rounded-md border border-border bg-background-primary px-3 py-2 text-sm text-foreground resize-none focus-visible:outline-none focus-visible:border-border-focus"
          placeholder="회사의 비전과 미션을 입력해요"
          value={visionMission}
          onChange={(e) => setVisionMission(e.target.value)}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={companyCodeActive}
          onChange={(e) => setCompanyCodeActive(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        회사코드로 가입 허용
      </label>

      {error && (
        <p role="alert" className="rounded-md bg-destructive-50 px-3 py-2 text-sm text-destructive-700">{error}</p>
      )}
      {success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">저장됐어요.</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "저장 중…" : "저장"}
        </Button>
      </div>
    </form>
  );
}
