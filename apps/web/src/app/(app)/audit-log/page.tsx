import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listAuditLogs } from "@teamlet/modules/security";

export const dynamic = "force-dynamic";

const EVENT_LABEL: Record<string, string> = {
  CREATE: "생성", READ: "조회", UPDATE: "수정", DELETE: "삭제", DOWNLOAD: "다운로드",
};
const EVENT_CLASS: Record<string, string> = {
  CREATE: "bg-green-50 text-green-700",
  READ: "bg-background-secondary text-foreground-muted",
  UPDATE: "bg-blue-50 text-blue-700",
  DELETE: "bg-destructive-50 text-destructive-700",
  DOWNLOAD: "bg-amber-50 text-amber-700",
};

const ACTIVITY_LABEL: Record<string, string> = {
  auth: "인증", tenancy: "회사", member: "구성원", leave: "휴가",
  workflow: "워크플로우", security: "보안", role: "권한",
};
const ACTIVITY_CLASS: Record<string, string> = {
  auth: "bg-purple-50 text-purple-700",
  tenancy: "bg-blue-50 text-blue-700",
  member: "bg-teal-50 text-teal-700",
  leave: "bg-green-50 text-green-700",
  workflow: "bg-amber-50 text-amber-700",
  security: "bg-destructive-50 text-destructive-700",
  role: "bg-background-secondary text-foreground-muted",
};

const ACTIVITY_TYPES = [
  { value: "", label: "전체 유형" },
  { value: "auth", label: "인증" },
  { value: "tenancy", label: "회사" },
  { value: "member", label: "구성원" },
  { value: "leave", label: "휴가" },
  { value: "workflow", label: "워크플로우" },
  { value: "security", label: "보안" },
  { value: "role", label: "권한" },
];

const EVENT_TYPES = [
  { value: "", label: "전체 이벤트" },
  { value: "CREATE", label: "생성" },
  { value: "READ", label: "조회" },
  { value: "UPDATE", label: "수정" },
  { value: "DELETE", label: "삭제" },
  { value: "DOWNLOAD", label: "다운로드" },
];

function buildHref(base: Record<string, string>, override: Record<string, string>) {
  const p = new URLSearchParams({ ...base, ...override });
  if (!override.page) p.delete("page");
  for (const [k, v] of Array.from(p.entries())) {
    if (!v) p.delete(k);
  }
  const qs = p.toString();
  return `/audit-log${qs ? `?${qs}` : ""}`;
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; type?: string; event?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1"));
  const q = params.q?.trim() ?? "";
  const activityType = params.type ?? "";
  const eventType = params.event ?? "";
  const limit = 50;
  const offset = (page - 1) * limit;

  const result = await listAuditLogs(session.user.employeeId, {
    limit,
    offset,
    q: q || undefined,
    activityType: activityType || undefined,
    eventType: eventType || undefined,
  });
  const { items, total } = result.ok ? result.data : { items: [], total: 0 };
  const totalPages = Math.ceil(total / limit);

  const baseParams = { q, type: activityType, event: eventType };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">감사 로그</h1>
        <p className="mt-0.5 text-sm text-foreground-muted">
          회사 내 활동 이력 · 총 {total.toLocaleString()}건
        </p>
      </div>

      {/* 필터 바 */}
      <div className="mb-4 flex flex-wrap gap-2">
        <form method="get" action="/audit-log" className="flex">
          <input type="hidden" name="type" value={activityType} />
          <input type="hidden" name="event" value={eventType} />
          <input
            name="q"
            defaultValue={q}
            placeholder="설명·담당자 검색"
            className="h-9 w-52 rounded-lg border border-border bg-background-primary px-3 text-sm text-foreground placeholder:text-foreground-subtle focus-visible:outline-none"
          />
        </form>

        <div className="flex gap-1 rounded-lg border border-border bg-background-secondary p-0.5">
          {ACTIVITY_TYPES.map((t) => (
            <Link
              key={t.value}
              href={buildHref(baseParams, { type: t.value })}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                activityType === t.value
                  ? "bg-background-primary font-medium text-foreground shadow-sm"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-1 rounded-lg border border-border bg-background-secondary p-0.5">
          {EVENT_TYPES.map((t) => (
            <Link
              key={t.value}
              href={buildHref(baseParams, { event: t.value })}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                eventType === t.value
                  ? "bg-background-primary font-medium text-foreground shadow-sm"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 로그 목록 */}
      {items.length === 0 ? (
        <p className="mt-8 text-center text-sm text-foreground-muted">
          {q || activityType || eventType ? "검색 결과가 없어요." : "기록된 감사 로그가 없어요."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border text-sm">
          <div className="grid grid-cols-[155px_68px_78px_1fr_110px] gap-3 border-b border-border bg-background-secondary px-4 py-2 text-xs font-medium text-foreground-muted">
            <span>시각</span><span>이벤트</span><span>유형</span><span>내용</span>
            <span className="text-right">담당자</span>
          </div>
          <div className="divide-y divide-border">
            {items.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-[155px_68px_78px_1fr_110px] items-center gap-3 px-4 py-2.5 hover:bg-background-secondary"
              >
                <span className="text-xs tabular-nums text-foreground-subtle">
                  {log.occurredAt.toLocaleString("ko-KR", {
                    month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                  })}
                </span>
                <span className={`inline-flex justify-center rounded px-1.5 py-0.5 text-xs ${EVENT_CLASS[log.eventType] ?? "bg-background-secondary text-foreground-muted"}`}>
                  {EVENT_LABEL[log.eventType] ?? log.eventType}
                </span>
                <span className={`inline-flex justify-center rounded px-1.5 py-0.5 text-xs ${ACTIVITY_CLASS[log.activityType] ?? "bg-background-secondary text-foreground-muted"}`}>
                  {ACTIVITY_LABEL[log.activityType] ?? log.activityType}
                </span>
                <span className="truncate text-foreground">{log.description}</span>
                <span className="truncate text-right text-xs text-foreground-subtle">
                  {log.actorName ?? log.actorEmail ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={buildHref(baseParams, { page: String(page - 1) })} className="rounded border border-border px-3 py-1.5 text-sm hover:bg-background-secondary">
              이전
            </Link>
          )}
          <span className="px-3 py-1.5 text-sm text-foreground-muted">{page} / {totalPages}</span>
          {page < totalPages && (
            <Link href={buildHref(baseParams, { page: String(page + 1) })} className="rounded border border-border px-3 py-1.5 text-sm hover:bg-background-secondary">
              다음
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
