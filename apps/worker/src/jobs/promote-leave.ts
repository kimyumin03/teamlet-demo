import { Worker, Queue, type Job } from "bullmq";
import type IORedis from "ioredis";
import { runSmartPromotionAll } from "@teamlet/modules/leave";

export const PROMOTE_LEAVE_JOB = "promote-leave-usage";

export function createPromoteLeaveQueue(connection: IORedis) {
  return new Queue(PROMOTE_LEAVE_JOB, { connection });
}

export function createPromoteLeaveWorker(connection: IORedis) {
  return new Worker(
    PROMOTE_LEAVE_JOB,
    async (_job: Job) => {
      const results = await runSmartPromotionAll();
      const total = results.reduce((s, r) => s + r.created, 0);
      const errors = results.flatMap((r) => r.errors);
      if (errors.length > 0) {
        console.warn("[promote-leave] 에러:", errors.slice(0, 5));
      }
      console.log(`[promote-leave] 완료 — 생성 ${total}건`);
      return { total, errors };
    },
    { connection },
  );
}
