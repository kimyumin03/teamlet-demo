import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCandidate } from "@teamlet/modules/recruit";
import type { CandidateResult } from "@teamlet/modules/recruit";
import { auth } from "@/auth";
import { CandidateActions } from "@/components/recruit/candidate-actions";
import { CandidateNoteForm } from "@/components/recruit/candidate-note-form";

export const dynamic = "force-dynamic";

const RESULT_LABEL: Record<CandidateResult, string> = {
  IN_PROGRESS: "진행중", PASSED: "합격", FAILED: "불합격", WITHDRAWN: "사퇴",
};
const RESULT_CLASS: Record<CandidateResult, string> = {
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  PASSED: "bg-green-50 text-green-700",
  FAILED: "bg-destructive-50 text-destructive-700",
  WITHDRAWN: "bg-background-secondary text-foreground-subtle",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-foreground-subtle">{label}</dt>
      <dd className="text-sm text-foreground">{children || "—"}</dd>
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
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href={`/recruit/postings/${postingId}`}
        className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {c.posting.title}
      </Link>

      <header className="mt-4 mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{c.name}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{c.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${RESULT_CLASS[c.result]}`}>
            {RESULT_LABEL[c.result]}
          </span>
          <CandidateActions
            candidateId={c.id}
            stages={c.posting.stages}
            currentResult={c.result}
          />
        </div>
      </header>

      {/* 기본 정보 */}
      <section className="mb-6 rounded-lg border border-border bg-background-primary p-5">
        <h2 className="mb-4 text-sm font-medium text-foreground">기본 정보</h2>
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
        <section className="mb-6 rounded-lg border border-border bg-background-primary p-5">
          <h2 className="mb-3 text-sm font-medium text-foreground">전형 단계</h2>
          <div className="flex gap-2 flex-wrap">
            {c.posting.stages.map((s) => (
              <span
                key={s.id}
                className={`rounded-full border px-3 py-1 text-xs ${
                  s.name === c.currentStageName
                    ? "border-foreground bg-foreground text-background"
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
      <section className="rounded-lg border border-border bg-background-primary p-5">
        <h2 className="mb-3 text-sm font-medium text-foreground">메모</h2>
        <CandidateNoteForm candidateId={c.id} initialNote={c.note} />
      </section>
    </div>
  );
}
