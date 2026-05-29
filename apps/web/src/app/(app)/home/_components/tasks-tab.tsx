"use client";

import Link from "next/link";
import type { PendingApprovalItem, DocumentListItem } from "@teamlet/modules/workflow";

const KIND_LABEL: Record<string, string> = {
  LEAVE_REQUEST: "휴가",
  GENERAL: "일반",
  INFO_CHANGE: "정보변경",
  ANNOUNCEMENT: "공지",
};
const KIND_CLS: Record<string, string> = {
  LEAVE_REQUEST: "tag-green",
  GENERAL: "tag-blue",
  INFO_CHANGE: "tag-amber",
  ANNOUNCEMENT: "tag-purple",
};

function daysSince(d: Date) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

function DueBadge({ days, urgent }: { days: number; urgent: boolean }) {
  const label = days === 0 ? "오늘" : days === 1 ? "D+1" : `D+${days}`;
  return (
    <span className={`due${urgent ? " urgent" : days >= 1 ? " soon" : ""}`}>
      {label}
    </span>
  );
}

export function TasksTab({
  pending,
  myDocs,
}: {
  pending: PendingApprovalItem[];
  myDocs: DocumentListItem[];
}) {
  const urgent = pending.filter((p) => daysSince(p.createdAt) >= 2);
  const normal = pending.filter((p) => daysSince(p.createdAt) < 2);
  const requestedDocs = myDocs.filter((d) => d.status === "IN_PROGRESS");

  if (pending.length === 0 && requestedDocs.length === 0) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--fg-muted)" }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>✓</div>
        <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--fg)", marginBottom: "6px" }}>
          모두 처리했어요
        </div>
        <div style={{ fontSize: "12.5px" }}>대기 중인 결재나 진행 문서가 없어요.</div>
      </div>
    );
  }

  return (
    <section>
      {/* 마감 임박 */}
      {urgent.length > 0 && (
        <div className="todo-group-h">
          <h4>마감 임박 <span className="c">{urgent.length}</span></h4>
          {urgent.map((item) => {
            const days = daysSince(item.createdAt);
            return (
              <Link key={item.id} href={`/workflow/documents/${item.documentId}`} className="todo-row">
                <span className="check" />
                <div className="body">
                  <div className="t">
                    <span className={`tag-xs ${KIND_CLS[item.documentKind] ?? "tag-blue"}`}>
                      {KIND_LABEL[item.documentKind] ?? item.documentKind}
                    </span>
                    {item.documentTitle}
                  </div>
                  <div className="s">
                    {item.authorName} 기안 · {item.step}/{item.totalSteps}단계
                  </div>
                </div>
                <DueBadge days={days} urgent={true} />
                <span className="open-arr">→</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* 결재 대기 */}
      {normal.length > 0 && (
        <div className="todo-group-h">
          <h4>결재 대기 <span className="c">{normal.length}</span></h4>
          {normal.map((item) => {
            const days = daysSince(item.createdAt);
            return (
              <Link key={item.id} href={`/workflow/documents/${item.documentId}`} className="todo-row">
                <span className="check" />
                <div className="body">
                  <div className="t">
                    <span className={`tag-xs ${KIND_CLS[item.documentKind] ?? "tag-blue"}`}>
                      {KIND_LABEL[item.documentKind] ?? item.documentKind}
                    </span>
                    {item.documentTitle}
                  </div>
                  <div className="s">
                    {item.authorName} 기안 · {item.step}/{item.totalSteps}단계
                  </div>
                </div>
                <DueBadge days={days} urgent={false} />
                <span className="open-arr">→</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* 요청한 일 */}
      {requestedDocs.length > 0 && (
        <div className="todo-group-h">
          <h4>내가 요청한 <span className="c">{requestedDocs.length}</span></h4>
          {requestedDocs.map((doc) => (
            <Link key={doc.id} href={`/workflow/documents/${doc.id}`} className="todo-row">
              <span className="check" />
              <div className="body">
                <div className="t">
                  <span className={`tag-xs ${KIND_CLS[doc.kind] ?? "tag-blue"}`}>
                    {KIND_LABEL[doc.kind] ?? doc.kind}
                  </span>
                  {doc.title}
                </div>
                <div className="s">
                  {doc.currentStep !== null
                    ? `${doc.currentStep}/${doc.totalSteps}단계 결재 중`
                    : `총 ${doc.totalSteps}단계`}
                </div>
              </div>
              <span className="due">진행</span>
              <span className="open-arr">→</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
