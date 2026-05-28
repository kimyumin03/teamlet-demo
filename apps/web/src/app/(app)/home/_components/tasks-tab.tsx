"use client";

import Link from "next/link";
import type { PendingApprovalItem, DocumentListItem } from "@teamlet/modules/workflow";

function daysSince(d: Date) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

function DueBadge({ days }: { days: number }) {
  if (days >= 3) return <span className="rounded-[6px] border border-destructive-600 bg-destructive-50 px-2.5 py-1 font-mono text-[11.5px] font-semibold text-destructive-600">D+{days}</span>;
  if (days >= 1) return <span className="rounded-[6px] border border-amber-400 bg-amber-50 px-2.5 py-1 font-mono text-[11.5px] font-semibold text-amber-600">D+{days}</span>;
  return <span className="rounded-[6px] border border-border bg-background-secondary px-2.5 py-1 font-mono text-[11.5px] font-semibold text-foreground-muted">오늘</span>;
}

function TodoRow({ title, sub, days, href }: { title: string; sub: string; days: number; href: string }) {
  return (
    <Link
      href={href}
      className="grid grid-cols-[20px_1fr_auto_auto] items-center gap-4 rounded-[12px] border border-border bg-background-primary px-4 py-3.5 mb-2 transition-colors hover:border-border-strong hover:translate-x-0.5"
    >
      <span className="h-[18px] w-[18px] rounded-[5px] border-[1.5px] border-border" />
      <div>
        <div className="text-[14px] font-semibold text-foreground truncate">{title}</div>
        <div className="mt-0.5 text-[12px] text-foreground-muted">{sub}</div>
      </div>
      <DueBadge days={days} />
      <span className="text-[13px] text-foreground-subtle">→</span>
    </Link>
  );
}

function GroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <h4 className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-foreground-muted">
      {label}
      <span className="rounded-full bg-background-tertiary px-2 py-0.5 font-mono text-[10.5px] font-bold text-foreground">
        {count}
      </span>
    </h4>
  );
}

export function TasksTab({
  pending,
  myDocs,
}: {
  pending: PendingApprovalItem[];
  myDocs: DocumentListItem[];
}) {
  const urgent = pending.filter((p) => daysSince(p.createdAt) >= 3);
  const normal = pending.filter((p) => daysSince(p.createdAt) < 3);
  const requestedDocs = myDocs.filter((d) => d.status === "IN_PROGRESS");

  if (pending.length === 0 && requestedDocs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background-secondary text-xl">
          ✓
        </div>
        <p className="text-[14px] font-medium text-foreground">모두 처리했어요</p>
        <p className="text-[12.5px] text-foreground-muted">대기 중인 결재나 진행 문서가 없어요.</p>
      </div>
    );
  }

  return (
    <section className="max-w-2xl">
      {urgent.length > 0 && (
        <div className="mb-7">
          <GroupHeader label="처리 지연" count={urgent.length} />
          {urgent.map((item) => (
            <TodoRow
              key={item.id}
              title={item.documentTitle}
              sub={`${item.authorName} 기안 · ${item.step}/${item.totalSteps}단계`}
              days={daysSince(item.createdAt)}
              href={`/workflow/documents/${item.documentId}`}
            />
          ))}
        </div>
      )}

      {normal.length > 0 && (
        <div className="mb-7">
          <GroupHeader label="결재 대기" count={normal.length} />
          {normal.map((item) => (
            <TodoRow
              key={item.id}
              title={item.documentTitle}
              sub={`${item.authorName} 기안 · ${item.step}/${item.totalSteps}단계`}
              days={daysSince(item.createdAt)}
              href={`/workflow/documents/${item.documentId}`}
            />
          ))}
        </div>
      )}

      {requestedDocs.length > 0 && (
        <div className="mb-7">
          <GroupHeader label="요청한 일" count={requestedDocs.length} />
          {requestedDocs.map((doc) => (
            <Link
              key={doc.id}
              href={`/workflow/documents/${doc.id}`}
              className="grid grid-cols-[20px_1fr_auto] items-center gap-4 rounded-[12px] border border-border bg-background-primary px-4 py-3.5 mb-2 transition-colors hover:border-border-strong"
            >
              <span className="h-[18px] w-[18px] rounded-[5px] border-[1.5px] border-border" />
              <div>
                <div className="text-[14px] font-semibold text-foreground truncate">{doc.title}</div>
                <div className="mt-0.5 text-[12px] text-foreground-muted">
                  {doc.currentStep !== null ? `${doc.currentStep}/${doc.totalSteps}단계 결재 중` : `총 ${doc.totalSteps}단계`}
                </div>
              </div>
              <span className="text-[13px] text-foreground-subtle">→</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
