"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[var(--primary)] text-[var(--primary-on)] text-[12px]">
      <span className="rounded px-1.5 py-0.5 bg-[var(--primary-on)]/15 font-semibold text-[11px] tracking-wide">
        DEMO
      </span>
      <span className="opacity-90">
        체험 모드입니다. 관리자 권한으로 모든 기능을 사용해 볼 수 있어요.
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="ml-auto p-0.5 rounded opacity-70 hover:opacity-100 transition-opacity"
        aria-label="배너 닫기"
      >
        <X size={14} />
      </button>
    </div>
  );
}
