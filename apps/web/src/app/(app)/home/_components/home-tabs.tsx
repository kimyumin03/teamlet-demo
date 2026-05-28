"use client";

import Link from "next/link";

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
    <div className="tabs">
      <Link href="/home?tab=feed" className={`tab${activeTab === "feed" ? " active" : ""}`}>
        홈 피드
      </Link>
      <Link href="/home?tab=news" className={`tab${activeTab === "news" ? " active" : ""}`}>
        소식
        {announcementCount > 0 && <span className="count">{announcementCount}</span>}
      </Link>
      <Link href="/home?tab=tasks" className={`tab${activeTab === "tasks" ? " active" : ""}`}>
        할 일
        {pendingCount > 0 && <span className="count">{pendingCount}</span>}
      </Link>
    </div>
  );
}
