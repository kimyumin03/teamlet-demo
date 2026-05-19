/**
 * Prisma 클라이언트 싱글톤 (docs/04 §2 /apps/web/lib/db).
 * 일반 CRUD 의 90% 는 Prisma — 복잡 쿼리(시점/검색/scope)는 ./kysely.
 */
import { PrismaClient } from "../generated/client/index.js";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "../generated/client/index.js";
