/**
 * Prisma 클라이언트 싱글톤 (docs/04 §2 /apps/web/lib/db).
 * 일반 CRUD 의 90% 는 Prisma — 복잡 쿼리(시점/검색/scope)는 ./kysely.
 *
 * ⚠️ axhub 런타임 Pod 는 외부 TCP 5432 아웃바운드를 막아 Prisma 직접연결(P1001)이 실패한다.
 * DATABASE_URL 이 Neon 이면 serverless 드라이버 어댑터(443/WebSocket)로 우회한다(v1 과 동일 경로).
 * 로컬 dev(localhost) 는 표준 엔진 연결을 그대로 사용.
 */
import { PrismaClient } from "../generated/client/index";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL ?? "";
const useNeonServerless = databaseUrl.includes("neon.tech");

if (useNeonServerless) {
  // Neon serverless 는 WebSocket(443)으로 풀 연결(트랜잭션 지원).
  // Node 22 네이티브 WebSocket 사용 — 'ws' 번들 시 bufferutil 깨짐(`bufferUtil.mask is not a function`) 회피.
  const NativeWebSocket = (globalThis as { WebSocket?: unknown }).WebSocket;
  if (NativeWebSocket) {
    neonConfig.webSocketConstructor =
      NativeWebSocket as typeof neonConfig.webSocketConstructor;
  }
}

const logLevels: ("warn" | "error")[] =
  process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];

function createPrisma(): PrismaClient {
  if (useNeonServerless) {
    const adapter = new PrismaNeon({ connectionString: databaseUrl });
    return new PrismaClient({ adapter, log: logLevels });
  }
  return new PrismaClient({ log: logLevels });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "../generated/client/index";
