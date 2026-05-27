"use client";

import Link from "next/link";
import { useState } from "react";
import { ClipboardList } from "lucide-react";
import type { PendingApprovalItem, DocumentListItem } from "@teamlet/modules/workflow";

const STATUS_CLASS: Record<string, string> = {
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  APPROVED: "bg-background-secondary text-foreground-muted",
  REJECTED: "bg-destructive-50 text-destructive-700",
};
const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: "진행중",
  APPROVED: "승인",
  REJECTED: "반려",
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

function EmptyTask({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background-secondary">
        <ClipboardList className="h-5 w-5 text-foreground-subtle" />
      </div>
      <p className="text-sm text-foreground-muted">{label}</p>
    </div>
  );
}

const SUB_TABS = [
  { id: "assigned", label: "해야할일" },
  { id: "requested", label: "요청한일" },
  { id: "cc", label: "참조" },
] as const;

type SubTabId = (typeof SUB_TABS)[number]["id"];

export function TasksTab({
  pending,
  myDocs,
}: {
  pending: PendingApprovalItem[];
  myDocs: DocumentListItem[];
}) {
  const [activeView, setActiveView] = useState<SubTabId>("assigned");

  const requestedDocs = myDocs.filter((d) => d.status === "IN_PROGRESS");

  return (
    <div className="max-w-3xl">
      {/* 서브탭 */}
      <div className="flex gap-1 border-b border-border mb-6">
        {SUB_TABS.map((t) => {
          const count =
            t.id === "assigned" ? pending.length : t.id === "requested" ? requestedDocs.length : 0;
          return (
            <button
              key={t.id}
              onClick={() => setActiveView(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
                activeView === t.id
                  ? "border-foreground text-foreground font-medium"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-background-secondary px-1 text-[10px] font-semibold text-foreground-muted">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 해야할일 */}
      {activeView === "assigned" && (
        <>
          {pending.length === 0 ? (
            <EmptyTask label="승인할 문서가 없어요. 결재 대기 목록이 비어 있어요." />
          ) : (
            <ul className="flex flex-col gap-2">
              {pending.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/workflow/documents/${item.documentId}`}
                    className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/30 px-5 py-4 hover:bg-amber-50/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.documentTitle}
                      </p>
                      <p className="text-xs text-foreground-muted mt-0.5">
                        {item.authorName} 기안 · {item.step}/{item.totalSteps}단계 ·{" "}
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <span className="ml-4 shrink-0 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                      승인 필요
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* 요청한일 */}
      {activeView === "requested" && (
        <>
          {requestedDocs.length === 0 ? (
            <EmptyTask label="진행 중인 문서가 없어요. 결재가 필요한 문서를 기안해 보세요." />
          ) : (
            <ul className="flex flex-col gap-2">
              {requestedDocs.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href={`/workflow/documents/${doc.id}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-background-primary px-5 py-4 hover:bg-background-secondary transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{doc.title}</p>
                      <p className="text-xs text-foreground-muted mt-0.5">
                        {formatDate(doc.createdAt)} ·{" "}
                        {doc.currentStep !== null
                          ? `${doc.currentStep}/${doc.totalSteps}단계 결재 중`
                          : `총 ${doc.totalSteps}단계`}
                      </p>
                    </div>
                    <span
                      className={`ml-4 shrink-0 rounded-md px-2.5 py-1 text-xs ${STATUS_CLASS[doc.status] ?? "text-foreground-muted"}`}
                    >
                      {STATUS_LABEL[doc.status] ?? doc.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* 참조 */}
      {activeView === "cc" && (
        <EmptyTask label="참조로 수신된 문서가 없어요." />
      )}
    </div>
  );
}
