import { NextResponse } from "next/server";

// 배포 헬스체크용 (axhub.yaml runtime.health_path). 가볍게 200만 반환 —
// DB/Redis 의존성 체크는 liveness 를 불안정하게 만들 수 있어 의도적으로 제외.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" });
}
