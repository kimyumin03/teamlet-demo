"use client";

import Link from "next/link";

const TABS = [
  { id: "feed", label: "홈 피드" },
  { id: "news", label: "회사소식" },
  { id: "tasks", label: "할일" },
] as const;

export function HomeTabs({
  activeTab,
  pendingCount,
}: {
  activeTab: string;
  pendingCount: number;
}) {
  return (
    <nav className="flex gap-1 border-b border-border mb-6">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={`/home?tab=${tab.id}`}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              isActive
                ? "border-foreground text-foreground"
                : "border-transparent text-foreground-muted hover:text-foreground hover:border-border"
            }`}
          >
            {tab.label}
            {tab.id === "tasks" && pendingCount > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
