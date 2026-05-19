/**
 * Teamlet 백그라운드 워커 (BullMQ).
 * 잡 (docs/04 §2 /apps/worker/jobs):
 *   - send-notification        알림 발송 (NotificationDispatcher)
 *   - auto-grant-leave         연차 자동 부여
 *   - expire-leave             휴가 소멸
 *   - promote-leave-usage      스마트 연차 촉진
 *   - cleanup-notifications    보존 정책 기반 알림 정리
 *
 * Phase 3(휴가)부터 실제 잡 구현. 현재는 연결 부트스트랩만.
 */
import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

export const QUEUE_NAMES = {
  notification: "notification",
  leave: "leave",
  cleanup: "cleanup",
} as const;

// 큐 핸들 (Phase 3에서 Worker 프로세서 연결)
export const notificationQueue = new Queue(QUEUE_NAMES.notification, {
  connection,
});

async function main() {
  await connection.ping();
  // eslint-disable-next-line no-console
  console.log("[teamlet-worker] Redis 연결 완료 — 잡 등록 대기 (Phase 3+)");
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("[teamlet-worker] 부트스트랩 실패", e);
  process.exit(1);
});
