import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCandidate } from "@teamlet/modules/recruit";
import type { CandidateResult } from "@teamlet/modules/recruit";
import { auth } from "@/auth";
import { CandidateActions } from "@/components/recruit/candidate-actions";
import { CandidateNoteForm } from "@/components/recruit/candidate-note-form";

export const dynamic = "force-dynamic";

const RESULT_LABEL: Record<CandidateResult, string> = {
  IN_PROGRESS: "진행중", PASSED: "합격", FAILED: "불합격", WITHDRAWN: "사퇴",
};
const RESULT_CLS: Record<CandidateResult, string> = {
  IN_PROGRESS: "border-amber-300 bg-amber-50 text-amber-700",
  PASSED: "border-emerald-300 bg-emerald-50 text-emerald-700",
  FAILED: "border-destructive bg-destructive-50 text-destructive",
  WITHDRAWN: "border-border bg-background-secondary text-foreground-subtle",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11.5px] text-foreground-subtle">{label}</dt>
      <dd className="text-[13px] text-foreground">{children || "—"}</dd>
    </div>
  );
}

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string; candidateId: string }>;
}) {
  const { id: postingId, candidateId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const result = await getCandidate(session.user.employeeId, candidateId);
  if (!result.ok) notFound();

  const c = result.data;

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="shrink-0 border-b border-border bg-background-primary px-6 py-5">
        <Link
          href={`/recruit/postings/${postingId}`}
          className="mb-3 inline-flex items-center gap-1 text-[12px] text-foreground-subtle hover:text-foreground transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5">
            <path fillRule="evenodd" d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 1.06L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z" clipRule="evenodd" />
          </svg>
          {c.posting.title}
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight">{c.name}</h1>
            <p className="mt-0.5 text-[13px] text-foreground-muted">{c.email}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`rounded-[5px] border px-2 py-0.5 font-mono text-[11px] font-semibold ${RESULT_CLS[c.result]}`}>
              {RESULT_LABEL[c.result]}
            </span>
            <CandidateActions
              candidateId={c.id}
              stages={c.posting.stages}
              currentResult={c.result}
            />
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="mx-auto max-w-2xl flex flex-col gap-4">

          {/* 기본 정보 */}
          <section className="rounded-[14px] border border-border bg-background-primary p-5">
            <h2 className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-foreground-muted">기본 정보</h2>
            <dl className="grid grid-cols-2 gap-4">
              <Field label="이름">{c.name}</Field>
              <Field label="이메일">{c.email}</Field>
              <Field label="연락처">{c.phone ?? "—"}</Field>
              <Field label="지원일">
                {c.appliedAt.toLocaleDateString("ko-KR")}
              </Field>
              <Field label="현재 단계">{c.currentStageName ?? "미배정"}</Field>
              <Field label="결과">{RESULT_LABEL[c.result]}</Field>
            </dl>
          </section>

          {/* 전형 단계 */}
          {c.posting.stages.length > 0 && (
            <section className="rounded-[14px] border border-border bg-background-primary p-5">
              <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-foreground-muted">전형 단계</h2>
              <div className="flex flex-wrap gap-2">
                {c.posting.stages.map((s) => (
                  <span
                    key={s.id}
                    className={`rounded-full border px-3 py-1 font-mono text-[11px] ${
                      s.name === c.currentStageName
                        ? "border-foreground bg-foreground text-background-primary font-semibold"
                        : "border-border bg-background-secondary text-foreground-muted"
                    }`}
                  >
                    {s.order}. {s.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 메모 */}
          <section className="rounded-[14px] border border-border bg-background-primary p-5">
            <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-foreground-muted">메모</h2>
            <CandidateNoteForm candidateId={c.id} initialNote={c.note} />
          </section>
        </div>
      </div>
    </div>
  );
}
