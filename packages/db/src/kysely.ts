/**
 * Kysely 인스턴스 — 시점 기반 조회 / 검색(pg_trgm) / 동적 권한 scope 필터.
 * 타입은 prisma-kysely 가 schema.prisma 에서 생성 (단일 출처, docs/04 §1-3).
 *
 * ⚠️ axhub 런타임은 외부 TCP 5432 차단 → DATABASE_URL 이 Neon 이면 serverless Pool
 * (443/WebSocket, pg 호환)로 우회. 로컬 dev(localhost) 는 표준 pg.Pool 사용.
 */
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import type { DB } from "../generated/kysely-types";

const databaseUrl = process.env.DATABASE_URL ?? "";
const useNeonServerless = databaseUrl.includes("neon.tech");

if (useNeonServerless) {
  // Node 22 네이티브 WebSocket 사용 — 'ws' 번들 시 bufferutil 깨짐 회피.
  const NativeWebSocket = (globalThis as { WebSocket?: unknown }).WebSocket;
  if (NativeWebSocket) {
    neonConfig.webSocketConstructor =
      NativeWebSocket as typeof neonConfig.webSocketConstructor;
  }
}

const globalForKysely = globalThis as unknown as {
  kyselyPool?: pg.Pool;
};

function createPool(): pg.Pool {
  if (useNeonServerless) {
    // Neon serverless Pool 은 pg.Pool 인터페이스 호환 — Kysely PostgresDialect 에 그대로 주입.
    return new NeonPool({ connectionString: databaseUrl }) as unknown as pg.Pool;
  }
  return new pg.Pool({ connectionString: databaseUrl, max: 10 });
}

const pool = globalForKysely.kyselyPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForKysely.kyselyPool = pool;
}

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({ pool }),
});

export type { DB };
