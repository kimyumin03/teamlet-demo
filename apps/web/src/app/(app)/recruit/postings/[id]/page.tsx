import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, UserPlus } from "lucide-react";
import { getPosting } from "@teamlet/modules/recruit";
import type { PostingDetail, CandidateListItem } from "@teamlet/modules/recruit";
import { Button, EmptyState } from "@teamlet/ui";
import { auth } from "@/auth";
import { AddCandidateButton } from "@/components/recruit/add-candidate-button";
import { CandidateActions } from "@/components/recruit/candidate-actions";
import { PostingStatusButton } from "@/components/recruit/posting-status-button";
import { CandidateKanban } from "@/components/recruit/candidate-kanban";

export const dynamic = "force-dynamic";

const RESULT_LABEL: Record<CandidateListItem["result"], string> = {
  IN_PROGRESS: "진행중", PASSED: "합격", FAILED: "불합격", WITHDRAWN: "사퇴",
};

const RESULT_CLASS: Record<CandidateListItem["result"], string> = {
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  PASSED: "bg-background-secondary text-foreground-muted",
  FAILED: "bg-destructive-50 text-destructive-700",
  WITHDRAWN: "bg-background-secondary text-foreground-subtle",
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
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/recruit"><ChevronLeft /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{posting.title}</h1>
            <p className="mt-1 text-sm text-foreground-muted">
              담당자 {posting.managerName} · 후보자 {posting.candidates.length}명
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PostingStatusButton postingId={posting.id} currentStatus={posting.status} />
          <AddCandidateButton postingId={posting.id} stages={posting.stages} />
        </div>
      </header>

      {posting.description && (
        <section className="mb-8 rounded-lg border border-border bg-background-primary p-4">
          <p className="whitespace-pre-wrap text-sm text-foreground">{posting.description}</p>
        </section>
      )}

      {posting.stages.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {posting.stages.map((s) => (
            <span key={s.id} className="shrink-0 rounded-full border border-border bg-background-secondary px-3 py-1 text-xs text-foreground-muted">
              {s.order}. {s.name}
            </span>
          ))}
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground-muted">
            후보자 {posting.candidates.length}명
          </h2>
          <div className="flex gap-1 rounded-lg border border-border bg-background-secondary p-0.5">
            {[{ v: "list", label: "목록" }, { v: "kanban", label: "칸반" }].map(({ v, label }) => (
              <Link
                key={v}
                href={`/recruit/postings/${posting.id}?view=${v}`}
                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
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

        {posting.candidates.length === 0 ? (
          <EmptyState
            icon={<UserPlus />}
            title="등록된 후보자가 없어요"
            description="후보자 추가 버튼을 눌러 첫 지원자를 등록해 보세요."
          />
        ) : view === "kanban" ? (
          <CandidateKanban stages={posting.stages} candidates={posting.candidates} />
        ) : (
          <ul className="flex flex-col gap-1">
            {posting.candidates.map((c) => (
              <li
                key={c.id}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 rounded-lg border border-border bg-background-primary px-4 py-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className="text-sm text-foreground-muted">{c.email}</span>
                </div>
                <span className="text-sm text-foreground-muted">
                  {c.currentStageName ?? "단계 미배정"}
                </span>
                <span className={`rounded-md px-2 py-0.5 text-xs ${RESULT_CLASS[c.result]}`}>
                  {RESULT_LABEL[c.result]}
                </span>
                <CandidateActions
                  candidateId={c.id}
                  stages={posting.stages}
                  currentResult={c.result}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
