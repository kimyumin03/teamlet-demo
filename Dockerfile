FROM node:22-alpine AS base
# Prisma 엔진은 alpine(musl)에서 libssl/openssl 필요 — 미설치 시 generate/런타임 경고+실패
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable
WORKDIR /app

# ─────────────────────────────────────────────────────────────
# builder: 의존성 설치 → Prisma 생성 → Next standalone 빌드
#   pnpm 모노레포는 패키지별 node_modules(.bin 심링크)에 실행 바이너리를 둔다.
#   deps 스테이지에서 루트 node_modules만 COPY 하면 packages/db/node_modules/.bin/prisma
#   가 유실 → "prisma: not found". 따라서 install 을 builder 안에서 직접 수행한다.
# ─────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# 1) 매니페스트만 먼저 복사 → 의존성 레이어 캐싱 (소스 변경 시 재설치 안 함)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY packages/modules/package.json ./packages/modules/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/
RUN pnpm install --frozen-lockfile

# 2) 소스 복사 (.dockerignore 가 node_modules 제외 → 위에서 만든 심링크 트리 보존)
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm --filter @teamlet/db generate
RUN pnpm --filter web build:standalone

# ─────────────────────────────────────────────────────────────
# runner: standalone 산출물만 담은 경량 런타임 이미지
# ─────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

RUN mkdir -p /app/apps/web/public
COPY --from=builder /app/apps/web/public ./apps/web/public
# outputFileTracingRoot=모노레포 루트 → standalone 내부 구조가 apps/web/server.js
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
