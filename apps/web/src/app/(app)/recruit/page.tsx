import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
import { listPostings } from "@teamlet/modules/recruit";
import type { PostingListItem } from "@teamlet/modules/recruit";
import { EmptyState } from "@teamlet/ui";
import { auth } from "@/auth";
import { CreatePostingButton } from "@/components/recruit/create-posting-button";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<PostingListItem["status"], string> = {
  DRAFT: "초안", OPEN: "진행중", CLOSED: "마감", CANCELLED: "취소",
};

const STATUS_CLASS: Record<PostingListItem["status"], string> = {
  DRAFT: "bg-background-secondary text-foreground-subtle",
  OPEN: "bg-amber-50 text-amber-700",
  CLOSED: "bg-background-secondary text-foreground-muted",
  CANCELLED: "bg-background-secondary text-foreground-subtle",
};

export default async function RecruitPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");

  const result = await listPostings(session.user.employeeId);
  const postings = result.ok ? result.data : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">채용</h1>
          <p className="mt-1 text-sm text-foreground-muted">공고 {postings.length}건</p>
        </div>
        <CreatePostingButton />
      </header>

      {postings.length === 0 ? (
        <EmptyState
          icon={<Briefcase />}
          title="등록된 공고가 없어요"
          description="공고 만들기 버튼을 눌러 첫 채용을 시작해 보세요."
        />
      ) : (
        <ul className="flex flex-col gap-1">
          {postings.map((p) => (
            <li key={p.id}>
              <Link
                href={`/recruit/postings/${p.id}`}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 rounded-lg border border-border bg-background-primary px-4 py-3 transition-colors hover:bg-background-secondary"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">{p.title}</span>
                  <span className="text-sm text-foreground-muted">{p.managerName}</span>
                </div>
                <span className="text-sm text-foreground-muted">후보자 {p.candidateCount}명</span>
                <span className={`rounded-md px-2 py-0.5 text-xs ${STATUS_CLASS[p.status]}`}>
                  {STATUS_LABEL[p.status]}
                </span>
                <div />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
