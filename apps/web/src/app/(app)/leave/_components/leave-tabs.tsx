"use client";

import Link from "next/link";

const TABS = [
  { id: "overview", label: "휴가 개요" },
  { id: "history", label: "신청 이력" },
] as const;

export function LeaveTabs({
  activeTab,
  pendingCount,
}: {
  activeTab: string;
  pendingCount: number;
}) {
  return (
    <div className="tabs">
      <Link href="/leave?tab=overview" className={`tab${activeTab === "overview" ? " active" : ""}`}>
        휴가 개요
      </Link>
      <Link href="/leave?tab=history" className={`tab${activeTab === "history" ? " active" : ""}`}>
        신청 이력
        {pendingCount > 0 && <span className="count">{pendingCount}</span>}
      </Link>
    </div>
  );
}
