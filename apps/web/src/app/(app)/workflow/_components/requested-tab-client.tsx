"use client";

import { useState } from "react";
import Link from "next/link";
import type { DocumentListItem } from "@teamlet/modules/workflow";
import type { FormDocumentKind } from "@teamlet/modules/workflow";
import type { EmployeeListItem } from "@teamlet/modules/employee";
import type { FormTemplateItem } from "@teamlet/modules/workflow";
import { CreateDocumentButton } from "@/components/workflow/create-document-button";

const KIND_LABEL: Record<FormDocumentKind, string> = {
  GENERAL: "일반", LEAVE_REQUEST: "휴가 신청", LEAVE_PLAN: "연차 사용 계획", INFO_CHANGE: "정보변경", ANNOUNCEMENT: "공지",
};
const KIND_CSS: Record<FormDocumentKind, string> = {
  GENERAL: "", LEAVE_REQUEST: "leave", LEAVE_PLAN: "leave", INFO_CHANGE: "hr", ANNOUNCEMENT: "",
};
const STATUS_LABEL: Record<string, string> = {
  DRAFT: "임시저장", IN_PROGRESS: "진행 중", APPROVED: "승인", REJECTED: "반려", CANCELLED: "취소",
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}
function daysSince(d: Date) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

function StepLine({ current, total, rejected = false }: { current: number; total: number; rejected?: boolean }) {
  const steps = [
    { label: "신청", state: "done" as const },
    ...Array.from({ length: total }, (_, i) => {
      const step = i + 1;
      return {
        label: `${step}단계`,
        state: (rejected && step === current ? "rej" : step < current ? "done" : step === current ? "now" : "pending") as "done" | "now" | "rej" | "pending",
      };
    }),
  ];
  return (
    <div className="aline">
      {steps.map((s, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
          {i > 0 && <span className="arr">›</span>}
          <span className={`step ${s.state === "pending" ? "" : s.state}`}>{s.label}</span>
        </span>
      ))}
    </div>
  );
}

function SectionDivider({ label, count }: { label: string; count: number }) {
  return (
    <div className="sec-divider">
      <span>{label}</span><span className="ct">{count}</span><span className="line" />
    </div>
  );
}

type EmpItem = Pick<EmployeeListItem, "id" | "name" | "departmentName">;

export function RequestedTabClient({
  inProgressDocs,
  draftDocs,
  employees,
  templates,
}: {
  inProgressDocs: DocumentListItem[];
  draftDocs: DocumentListItem[];
  employees: EmpItem[];
  templates: FormTemplateItem[];
}) {
  const [kindFilter, setKindFilter] = useState<FormDocumentKind | "">("");

  const allDocs = [...inProgressDocs, ...draftDocs];
  const allKinds = Array.from(new Set(allDocs.map((d) => d.kind)));

  const filteredProgress = kindFilter ? inProgressDocs.filter((d) => d.kind === kindFilter) : inProgressDocs;
  const filteredDraft = kindFilter ? draftDocs.filter((d) => d.kind === kindFilter) : draftDocs;

  if (allDocs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--fg-muted)" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", marginBottom: 6 }}>기안한 문서가 없어요</div>
        <div style={{ fontSize: 12.5, marginBottom: 20 }}>새 문서를 작성해서 결재를 시작해보세요.</div>
        <CreateDocumentButton employees={employees} templates={templates} />
      </div>
    );
  }

  return (
    <div>
      {/* 필터 바 */}
      <div className="filters" style={{ marginBottom: 14 }}>
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as FormDocumentKind | "")}
          style={{
            height: 32, padding: "0 28px 0 12px", borderRadius: 999,
            border: "1px solid var(--border)", background: "var(--bg-primary)",
            fontSize: 12.5, color: kindFilter ? "var(--fg)" : "var(--fg-muted)",
            cursor: "pointer", fontFamily: "inherit", appearance: "none",
          }}
        >
          <option value="">종류 · 전체</option>
          {allKinds.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
        </select>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
          {filteredProgress.length + filteredDraft.length}건
        </span>
      </div>

      {filteredProgress.length > 0 && (
        <>
          <SectionDivider label="결재 진행 중" count={filteredProgress.length} />
          {filteredProgress.map((doc) => {
            const current = doc.currentStep ?? 0;
            return (
              <Link key={doc.id} href={`/workflow/documents/${doc.id}`} className="doc">
                <div className="doc-kind">
                  <span className={`k ${KIND_CSS[doc.kind]}`}>{KIND_LABEL[doc.kind]}</span>
                  <span className="d">{formatDate(doc.createdAt)}</span>
                </div>
                <div className="doc-body">
                  <div className="t">{doc.title}</div>
                  <div className="m">
                    {current > 0 ? `${current}/${doc.totalSteps}단계 결재 중` : `총 ${doc.totalSteps}단계`}
                    <span className="sep">·</span>
                    <span>{daysSince(doc.createdAt)}일 전 기안</span>
                  </div>
                </div>
                {current > 0 ? <StepLine current={current} total={doc.totalSteps} /> : <span />}
                <div className="doc-actions">
                  <span className="doc-due soon">진행</span>
                  <span className="open-arr">→</span>
                </div>
              </Link>
            );
          })}
        </>
      )}

      {filteredDraft.length > 0 && (
        <>
          <SectionDivider label="임시저장" count={filteredDraft.length} />
          {filteredDraft.map((doc) => (
            <Link key={doc.id} href={`/workflow/documents/${doc.id}`} className="doc">
              <div className="doc-kind">
                <span className={`k ${KIND_CSS[doc.kind]}`}>{KIND_LABEL[doc.kind]}</span>
                <span className="d">{formatDate(doc.createdAt)}</span>
              </div>
              <div className="doc-body">
                <div className="t">{doc.title}</div>
                <div className="m">임시저장됨 · {daysSince(doc.createdAt)}일 전</div>
              </div>
              <span />
              <div className="doc-actions">
                <span className="doc-due">임시저장</span>
                <span className="open-arr">→</span>
              </div>
            </Link>
          ))}
        </>
      )}

      {filteredProgress.length + filteredDraft.length === 0 && (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--fg-muted)", fontSize: 13 }}>
          선택한 종류의 문서가 없어요.
        </div>
      )}
    </div>
  );
}
