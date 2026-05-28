"use client";

import Link from "next/link";

const TABS = [
  { id: "feed", label: "홈 피드" },
  { id: "news", label: "소식" },
  { id: "tasks", label: "할 일" },
] as const;

export function HomeTabs({
  activeTab,
  pendingCount,
  announcementCount,
}: {
  activeTab: string;
  pendingCount: number;
  announcementCount: number;
}) {
  return (
    <nav className="flex gap-0 border-b border-border mb-6">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const count =
          tab.id === "tasks" ? pendingCount :
          tab.id === "news" ? announcementCount :
          0;
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
            {count > 0 && (
              <span className="rounded-full bg-background-secondary px-1.5 font-mono text-[10.5px] font-bold text-foreground">
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
