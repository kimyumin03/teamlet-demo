"use client";

import Link from "next/link";

const TABS = [
  { id: "dashboard", label: "대시보드" },
  { id: "history", label: "신청 내역" },
] as const;

export function LeaveTabs({
  activeTab,
  pendingCount,
}: {
  activeTab: string;
  pendingCount: number;
}) {
  return (
    <nav className="flex gap-1 border-b border-border mb-6">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={`/leave?tab=${tab.id}`}
          className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === tab.id
              ? "border-foreground text-foreground"
              : "border-transparent text-foreground-muted hover:text-foreground hover:border-border"
          }`}
        >
          {tab.label}
          {tab.id === "history" && pendingCount > 0 && (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-100 px-1 text-[10px] font-semibold text-amber-700">
              {pendingCount}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
