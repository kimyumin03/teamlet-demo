"use client";

import { useState, useTransition, useRef, useEffect } from "react";
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

export function NotificationBell({
  items,
  unreadCount,
}: {
  items: NotificationItem[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleMarkRead(id: string, deepLink: string | null) {
    startTransition(async () => {
      await markReadAction(id);
      router.refresh();
      if (deepLink) router.push(deepLink);
      setOpen(false);
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllReadAction();
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-2 text-foreground-muted hover:bg-background-secondary"
        aria-label="알림"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-lg border border-border bg-background-primary shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-medium text-foreground">알림</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="text-xs text-foreground-muted hover:text-foreground disabled:opacity-50"
              >
                모두 읽음
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-foreground-muted">알림이 없어요</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMarkRead(item.id, item.deepLink)}
                  disabled={isPending}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-background-secondary disabled:opacity-50 ${!item.isRead ? "bg-background-secondary" : ""}`}
                >
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${CATEGORY_COLOR[item.category] ?? "bg-border"}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${item.isRead ? "text-foreground-muted" : "font-medium text-foreground"}`}>
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-foreground-subtle">{item.body}</p>
                    <p className="mt-0.5 text-xs text-foreground-subtle">
                      {item.createdAt.toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
