import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPosting } from "@teamlet/modules/recruit";
import type { CandidateListItem } from "@teamlet/modules/recruit";
import { auth } from "@/auth";
import { AddCandidateButton } from "@/components/recruit/add-candidate-button";
import { CandidateActions } from "@/components/recruit/candidate-actions";
import { PostingStatusButton } from "@/components/recruit/posting-status-button";
import { CandidateKanban } from "@/components/recruit/candidate-kanban";

export const dynamic = "force-dynamic";

const RESULT_LABEL: Record<CandidateListItem["result"], string> = {
  IN_PROGRESS: "진행중", PASSED: "합격", FAILED: "불합격", WITHDRAWN: "사퇴",
};
const RESULT_CLS: Record<CandidateListItem["result"], string> = {
  IN_PROGRESS: "border-amber-300 bg-amber-50 text-amber-700",
  PASSED: "border-emerald-300 bg-emerald-50 text-emerald-700",
  FAILED: "border-destructive bg-destructive-50 text-destructive",
  WITHDRAWN: "border-border bg-background-secondary text-foreground-subtle",
};

export default async function PostingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const { view = "list" } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const result = await getPosting(session.user.employeeId, id);
  if (!result.ok) notFound();

  const posting = result.data;

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="shrink-0 px-8 pt-7 pb-3">
        <Link
          href="/recruit"
          className="mb-3 inline-flex items-center gap-1 text-[12px] text-foreground-subtle hover:text-foreground transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
            <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 1.06L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z" clipRule="evenodd" />
          </svg>
          채용 목록
        </Link>
        <div className="page-h" style={{ marginBottom: 0 }}>
          <div>
            <h1 className="h-title">{posting.title}</h1>
            <p className="h-sub mt-1.5">
              담당자 {posting.managerName} · 후보자 {posting.candidates.length}명
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <PostingStatusButton postingId={posting.id} currentStatus={posting.status} />
            <AddCandidateButton postingId={posting.id} stages={posting.stages} />
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {posting.description && (
          <div className="mb-6 rounded-[14px] border border-border bg-background-primary p-5">
            <p className="whitespace-pre-wrap text-[13px] text-foreground">{posting.description}</p>
          </div>
        )}

        {/* 전형 단계 */}
        {posting.stages.length > 0 && (
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {posting.stages.map((s) => (
              <span
                key={s.id}
                className="shrink-0 rounded-full border border-border bg-background-secondary px-3 py-1 font-mono text-[11px] text-foreground-muted"
              >
                {s.order}. {s.name}
              </span>
            ))}
          </div>
        )}

        {/* 후보자 섹션 헤더 */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-foreground-muted">
            후보자 {posting.candidates.length}명
          </p>
          <div className="flex gap-1 rounded-lg border border-border bg-background-secondary p-0.5">
            {[{ v: "list", label: "목록" }, { v: "kanban", label: "칸반" }].map(({ v, label }) => (
              <Link
                key={v}
                href={`/recruit/postings/${posting.id}?view=${v}`}
                className={`rounded-md px-2.5 py-1 text-[12px] transition-colors ${
                  view === v
                    ? "bg-background-primary font-medium text-foreground shadow-sm"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* 후보자 목록/칸반 */}
        {posting.candidates.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <p className="text-[14px] font-medium text-foreground">등록된 후보자가 없어요</p>
            <p className="text-[12.5px] text-foreground-muted">후보자 추가 버튼을 눌러 첫 지원자를 등록해 보세요.</p>
          </div>
        ) : view === "kanban" ? (
          <CandidateKanban stages={posting.stages} candidates={posting.candidates} postingId={posting.id} />
        ) : (
          <div className="flex flex-col gap-2">
            {posting.candidates.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 rounded-[14px] border border-border bg-background-primary px-5 py-4"
              >
                <Link
                  href={`/recruit/postings/${posting.id}/candidates/${c.id}`}
                  className="min-w-0"
                >
                  <p className="text-[13.5px] font-semibold text-foreground truncate hover:text-primary transition-colors">{c.name}</p>
                  <p className="mt-0.5 text-[12px] text-foreground-muted truncate">{c.email}</p>
                </Link>
                <span className="text-[12px] text-foreground-muted shrink-0">
                  {c.currentStageName ?? "단계 미배정"}
                </span>
                <span className={`rounded-[5px] border px-2 py-0.5 font-mono text-[11px] font-semibold shrink-0 ${RESULT_CLS[c.result]}`}>
                  {RESULT_LABEL[c.result]}
                </span>
                <CandidateActions
                  candidateId={c.id}
                  stages={posting.stages}
                  currentResult={c.result}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
