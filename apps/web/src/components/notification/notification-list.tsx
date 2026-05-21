"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { NotificationItem } from "@teamlet/modules/notification";
import { markReadAction, markAllReadAction } from "@/lib/actions/notification";

const CATEGORY_COLOR: Record<string, string> = {
  APPROVAL: "bg-primary",
  LEAVE: "bg-emerald-500",
  HR: "bg-purple-500",
  ANNOUNCEMENT: "bg-amber-500",
  SYSTEM_SECURITY: "bg-destructive-600",
};

const CATEGORY_LABEL: Record<string, string> = {
  APPROVAL: "결재",
  LEAVE: "휴가",
  HR: "인사",
  ANNOUNCEMENT: "공지",
  SYSTEM_SECURITY: "보안",
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

export function NotificationList({
  items,
  unreadCount,
  filter,
}: {
  items: NotificationItem[];
  unreadCount: number;
  filter: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleMarkRead(id: string, deepLink: string | null) {
    startTransition(async () => {
      await markReadAction(id);
      router.refresh();
      if (deepLink) router.push(deepLink);
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllReadAction();
      router.refresh();
    });
  }

  const displayed = filter === "unread" ? items.filter((i) => !i.isRead) : items;

  return (
    <div>
      {/* 툴바 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-border bg-background-secondary p-0.5">
          {[
            { value: "", label: "전체" },
            { value: "unread", label: `안 읽음 ${unreadCount > 0 ? `(${unreadCount})` : ""}` },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                const url = tab.value ? `/notifications?filter=${tab.value}` : "/notifications";
                router.push(url);
              }}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                filter === tab.value
                  ? "bg-background-primary font-medium text-foreground shadow-sm"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="text-sm text-foreground-muted hover:text-foreground disabled:opacity-50"
          >
            모두 읽음 처리
          </button>
        )}
      </div>

      {/* 알림 목록 */}
      {displayed.length === 0 ? (
        <p className="py-12 text-center text-sm text-foreground-muted">
          {filter === "unread" ? "안 읽은 알림이 없어요." : "알림이 없어요."}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border">
          {displayed.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleMarkRead(item.id, item.deepLink)}
                disabled={isPending}
                className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-background-secondary disabled:opacity-60 ${
                  !item.isRead ? "bg-background-secondary/60" : ""
                }`}
              >
                {/* 카테고리 점 */}
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${CATEGORY_COLOR[item.category] ?? "bg-border"}`} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${item.isRead ? "text-foreground-muted" : "font-semibold text-foreground"}`}>
                      {item.title}
                    </span>
                    {!item.isRead && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-foreground-muted">{item.body}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[11px] ${CATEGORY_COLOR[item.category] ?? "bg-border"} bg-opacity-15 text-foreground-muted`}>
                      {CATEGORY_LABEL[item.category] ?? item.category}
                    </span>
                    <span className="text-xs text-foreground-subtle">{timeAgo(item.createdAt)}</span>
                  </div>
                </div>

                {item.deepLink && (
                  <span className="shrink-0 text-xs text-foreground-subtle">→</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
