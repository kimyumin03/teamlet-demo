"use client";

import Link from "next/link";

export function HomeTabs({
  activeTab,
  pendingCount,
  recognitionUnread = 0,
}: {
  activeTab: string;
  pendingCount: number;
  recognitionUnread?: number;
}) {
  return (
    <div className="tabs">
      <Link href="/home?tab=feed" className={`tab${activeTab === "feed" ? " active" : ""}`}>
        홈 피드
      </Link>
      <Link href="/home?tab=news" className={`tab${activeTab === "news" ? " active" : ""}`}>
        회사 소식
      </Link>
      <Link href="/home?tab=recognition" className={`tab${activeTab === "recognition" ? " active" : ""}`}>
        인정·피드백
        {recognitionUnread > 0 && <span className="count">{recognitionUnread}</span>}
      </Link>
    </div>
  );
}
