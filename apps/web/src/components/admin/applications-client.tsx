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
  EmptyState,
  Input,
} from "@teamlet/ui";
import { Building2 } from "lucide-react";
import type { CompanyApplicationItem } from "@teamlet/modules/tenancy";
import {
  approveApplicationAction,
  rejectApplicationAction,
} from "@/lib/actions/platform";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "검토 대기",
  APPROVED: "승인됨",
  REJECTED: "반려됨",
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-green-50 text-green-700",
  REJECTED: "bg-destructive-50 text-destructive",
};

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function ApplicationsClient({
  applications,
}: {
  applications: CompanyApplicationItem[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] =
    useState<CompanyApplicationItem | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pending = applications.filter((a) => a.status === "PENDING");
  const processed = applications.filter((a) => a.status !== "PENDING");

  function handleApprove(app: CompanyApplicationItem) {
    setError(null);
    setPendingId(app.id);
    startTransition(async () => {
      const res = await approveApplicationAction(app.id);
      setPendingId(null);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive-50 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium text-foreground">
          검토 대기 ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <EmptyState
            icon={<Building2 />}
            title="검토할 신청이 없어요"
            description="새 회사 등록 신청이 들어오면 여기에 표시돼요."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((app) => (
              <li
                key={app.id}
                className="rounded-[14px] border border-border bg-background-primary p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base font-semibold text-foreground">
                      {app.companyName}
                    </span>
                    <span className="text-sm text-foreground-muted">
                      사업자 {app.businessNumber} · {app.industry} ·{" "}
                      {app.companySize}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-foreground-subtle">
                    {formatDate(app.createdAt)}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm md:grid-cols-2">
                  <Row label="대표자" value={app.representativeName} />
                  <Row label="연락처" value={app.contact} />
                  <Row
                    label="신청자"
                    value={`${app.applicantName} (${app.applicantEmail})`}
                  />
                </dl>

                {app.documentUrl && (
                  <a
                    href={app.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v-13A1.5 1.5 0 0 1 4.5 2h7.379a1.5 1.5 0 0 1 1.06.44l2.622 2.62A1.5 1.5 0 0 1 16 6.122V16.5A1.5 1.5 0 0 1 14.5 18h-10A1.5 1.5 0 0 1 3 16.5Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12.5 10 9.5l3 3M10 9.5V15" />
                    </svg>
                    사업자 증빙 서류 보기
                  </a>
                )}

                {app.memo && (
                  <p className="mt-3 rounded-md bg-background-secondary px-3 py-2 text-sm text-foreground-muted">
                    {app.memo}
                  </p>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => {
                      setError(null);
                      setRejectTarget(app);
                    }}
                  >
                    반려
                  </Button>
                  <Button
                    disabled={isPending && pendingId === app.id}
                    onClick={() => handleApprove(app)}
                  >
                    {isPending && pendingId === app.id ? "승인 중…" : "승인"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {processed.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-foreground">
            처리 완료 ({processed.length})
          </h2>
          <ul className="flex flex-col gap-1">
            {processed.map((app) => (
              <li
                key={app.id}
                className="flex items-center justify-between rounded-md border border-border bg-background-primary px-4 py-2.5"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {app.companyName}
                  </span>
                  <span className="text-xs text-foreground-muted">
                    {app.applicantName} ·{" "}
                    {app.reviewedAt ? formatDate(app.reviewedAt) : "—"}
                    {app.reviewMemo ? ` · ${app.reviewMemo}` : ""}
                  </span>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs ${STATUS_CLASS[app.status]}`}
                >
                  {STATUS_LABEL[app.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RejectDialog
        app={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onDone={() => {
          setRejectTarget(null);
          router.refresh();
        }}
        onError={setError}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-foreground-subtle">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

function RejectDialog({
  app,
  onClose,
  onDone,
  onError,
}: {
  app: CompanyApplicationItem | null;
  onClose: () => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const [memo, setMemo] = useState("");
  const [isPending, startTransition] = useTransition();
  const [fieldError, setFieldError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!app) return;
    setFieldError(null);
    startTransition(async () => {
      const res = await rejectApplicationAction(app.id, memo || undefined);
      if (!res.ok) {
        setFieldError(res.error.message);
        onError(res.error.message);
        return;
      }
      setMemo("");
      onDone();
    });
  }

  return (
    <Dialog
      open={app !== null}
      onOpenChange={(o) => {
        if (!o && !isPending) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>회사 신청 반려</DialogTitle>
          <DialogDescription>
            {app?.companyName} 신청을 반려해요. 반려 사유는 선택이에요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reject-memo"
              className="text-sm text-foreground-muted"
            >
              반려 사유 (선택)
            </label>
            <Input
              id="reject-memo"
              value={memo}
              maxLength={500}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          {fieldError && (
            <p
              role="alert"
              className="rounded-[14px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive"
            >
              {fieldError}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isPending}>
                취소
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "반려 중…" : "반려"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
