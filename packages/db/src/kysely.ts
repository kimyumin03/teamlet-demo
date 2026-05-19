/**
 * Kysely 인스턴스 — 시점 기반 조회 / 검색(pg_trgm) / 동적 권한 scope 필터.
 * 타입은 prisma-kysely 가 schema.prisma 에서 생성 (단일 출처, docs/04 §1-3).
 * Phase 2(시점 이력)부터 본격 사용.
 */
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { DB } from "../generated/kysely-types";

const globalForKysely = globalThis as unknown as {
  kyselyPool?: pg.Pool;
};

const pool =
  globalForKysely.kyselyPool ??
  new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForKysely.kyselyPool = pool;
}

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({ pool }),
});

export type { DB };
