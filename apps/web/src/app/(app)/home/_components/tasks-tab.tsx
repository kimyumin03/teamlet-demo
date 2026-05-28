"use client";

import Link from "next/link";
import type { PendingApprovalItem, DocumentListItem } from "@teamlet/modules/workflow";

function daysSince(d: Date) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
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
      <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--fg-muted)" }}>
        <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--fg)", marginBottom: "6px" }}>
          모두 처리했어요
        </div>
        <div style={{ fontSize: "12.5px" }}>대기 중인 결재나 진행 문서가 없어요.</div>
      </div>
    );
  }

  return (
    <section>
      {urgent.length > 0 && (
        <div className="todo-group-h">
          <h4>처리 지연 <span className="c">{urgent.length}</span></h4>
          {urgent.map((item) => (
            <Link key={item.id} href={`/workflow/documents/${item.documentId}`} className="todo-row">
              <span className="check" />
              <div className="body">
                <div className="t">{item.documentTitle}</div>
                <div className="s">{item.authorName} 기안 · {item.step}/{item.totalSteps}단계</div>
              </div>
              <span className="due urgent">D+{daysSince(item.createdAt)}</span>
              <span className="open-arr">→</span>
            </Link>
          ))}
        </div>
      )}

      {normal.length > 0 && (
        <div className="todo-group-h">
          <h4>결재 대기 <span className="c">{normal.length}</span></h4>
          {normal.map((item) => (
            <Link key={item.id} href={`/workflow/documents/${item.documentId}`} className="todo-row">
              <span className="check" />
              <div className="body">
                <div className="t">{item.documentTitle}</div>
                <div className="s">{item.authorName} 기안 · {item.step}/{item.totalSteps}단계</div>
              </div>
              <span className={`due${daysSince(item.createdAt) >= 1 ? " soon" : ""}`}>
                {daysSince(item.createdAt) === 0 ? "오늘" : `D+${daysSince(item.createdAt)}`}
              </span>
              <span className="open-arr">→</span>
            </Link>
          ))}
        </div>
      )}

      {requestedDocs.length > 0 && (
        <div className="todo-group-h">
          <h4>요청한 일 <span className="c">{requestedDocs.length}</span></h4>
          {requestedDocs.map((doc) => (
            <Link key={doc.id} href={`/workflow/documents/${doc.id}`} className="todo-row">
              <span className="check" />
              <div className="body">
                <div className="t">{doc.title}</div>
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
