# axhub-deploy 브랜치 전용 — 로컬 alpine(node:22-alpine) 에서 사전빌드한 standalone 을 풀어 실행만.
# next build 없음 → axhub 빌더 OOM 원천 차단. prebuilt.tar.gz 에 musl Prisma 엔진 포함.
FROM node:22-alpine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY prebuilt.tar.gz /tmp/prebuilt.tar.gz
RUN tar -xzf /tmp/prebuilt.tar.gz -C /app && rm /tmp/prebuilt.tar.gz && chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
