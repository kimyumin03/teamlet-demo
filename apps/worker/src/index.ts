/**
 * Teamlet 백그라운드 워커 (BullMQ)
 * - promote-leave-usage : 스마트 연차 촉진 (매일 09:00 KST)
 * - notification        : 알림 발송 (Phase 3+)
 */
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { createPromoteLeaveQueue, createPromoteLeaveWorker, PROMOTE_LEAVE_JOB } from "./jobs/promote-leave.js";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

export const QUEUE_NAMES = {
  notification: "notification",
  leave: "leave",
  cleanup: "cleanup",
} as const;

export const notificationQueue = new Queue(QUEUE_NAMES.notification, { connection });

async function main() {
  await connection.ping();
  console.log("[teamlet-worker] Redis 연결 완료");

  // 연차 촉진 큐 + 워커 등록
  const promoteQueue = createPromoteLeaveQueue(connection);
  const promoteWorker = createPromoteLeaveWorker(connection);

  promoteWorker.on("completed", (job, ret) => {
    console.log(`[promote-leave] job#${job.id} 완료 — 생성 ${ret?.total ?? 0}건`);
  });
  promoteWorker.on("failed", (job, err) => {
    console.error(`[promote-leave] job#${job?.id} 실패`, err.message);
  });

  // 매일 KST 09:00 (UTC 00:00) 실행
  await promoteQueue.add(
    PROMOTE_LEAVE_JOB,
    {},
    {
      repeat: { pattern: "0 0 * * *" }, // UTC 00:00 = KST 09:00
      jobId: "daily-promote-leave",
      removeOnComplete: { count: 7 },
      removeOnFail: { count: 30 },
    },
  );

  console.log("[teamlet-worker] 스케줄 등록 완료 — 연차 촉진 매일 KST 09:00");

  // 프로세스 종료 시 정리
  process.on("SIGTERM", async () => {
    await promoteWorker.close();
    await promoteQueue.close();
    await connection.quit();
    process.exit(0);
  });
}

main().catch((e) => {
  console.error("[teamlet-worker] 부트스트랩 실패", e);
  process.exit(1);
});
