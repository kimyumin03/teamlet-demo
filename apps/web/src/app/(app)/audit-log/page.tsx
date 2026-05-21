import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listAuditLogs } from "@teamlet/modules/security";

export const dynamic = "force-dynamic";

const EVENT_LABEL: Record<string, string> = {
  create: "생성", read: "조회", update: "수정", delete: "삭제", download: "다운로드",
};

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");

  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr ?? "1"));
  const limit = 50;
  const offset = (page - 1) * limit;

  const result = await listAuditLogs(session.user.employeeId, { limit, offset });
  const { items, total } = result.ok ? result.data : { items: [], total: 0 };
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">감사 로그</h1>
        <p className="mt-0.5 text-sm text-foreground-muted">회사 내 모든 활동 이력을 확인해요 (총 {total.toLocaleString()}건)</p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-foreground-muted">기록된 감사 로그가 없어요.</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border text-sm">
          {items.map((log) => (
            <div key={log.id} className="grid grid-cols-[140px_80px_1fr_120px] gap-3 px-4 py-3 hover:bg-background-secondary">
              <span className="text-xs text-foreground-subtle">
                {log.occurredAt.toLocaleString("ko-KR")}
              </span>
              <span className="rounded bg-background-secondary px-1.5 py-0.5 text-center text-xs text-foreground-muted">
                {EVENT_LABEL[log.eventType] ?? log.eventType}
              </span>
              <span className="truncate text-foreground">{log.description}</span>
              <span className="truncate text-right text-xs text-foreground-subtle">
                {log.actorName ?? log.actorEmail ?? "-"}
              </span>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {page > 1 && (
            <a href={`?page=${page - 1}`} className="rounded border border-border px-3 py-1.5 text-sm hover:bg-background-secondary">이전</a>
          )}
          <span className="px-3 py-1.5 text-sm text-foreground-muted">{page} / {totalPages}</span>
          {page < totalPages && (
            <a href={`?page=${page + 1}`} className="rounded border border-border px-3 py-1.5 text-sm hover:bg-background-secondary">다음</a>
          )}
        </div>
      )}
    </div>
  );
}
