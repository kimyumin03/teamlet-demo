"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkApprovalStatus } from "@/lib/actions/check-approval";

const COUNTDOWN_SECONDS = 3;

export function ApprovalPoller() {
  const router = useRouter();
  const [approved, setApproved] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  // 5초마다 승인 상태 확인
  useEffect(() => {
    if (approved) return;
    const id = setInterval(async () => {
      const status = await checkApprovalStatus();
      if (status === "approved") {
        setApproved(true);
      } else if (status === "rejected") {
        router.refresh(); // 서버 컴포넌트 재실행 → 반려 UI 표시
      }
    }, 5000);
    return () => clearInterval(id);
  }, [approved, router]);

  // 승인 후 카운트다운
  useEffect(() => {
    if (!approved) return;
    if (countdown <= 0) {
      router.push("/home");
      return;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [approved, countdown, router]);

  if (!approved) return null;

  // 승인 축하 오버레이
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-background-primary p-10 shadow-lg text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-green-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-10 text-green-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">승인됐습니다!</h2>
          <p className="mt-2 text-sm text-foreground-muted">
            환영합니다. 이제 Teamlet을 이용할 수 있어요.
          </p>
        </div>
        <p className="text-sm text-foreground-subtle">
          {countdown}초 후 홈으로 이동합니다…
        </p>
      </div>
    </div>
  );
}
