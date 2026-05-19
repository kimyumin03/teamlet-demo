# Teamlet

풀스펙 한국형 HR SaaS — **Flex 대체** 목표 (간소화 ❌).

> 기획/분석/설계 문서: [`/docs`](./docs) (00 킥오프 → 06 화면 명세).
> Claude Code 작업 지침: [`CLAUDE.md`](./CLAUDE.md) (5원칙 + Anti-Pattern 12개).

## 스택

Next.js 15 (App Router) · TypeScript strict · Tailwind v4 · Prisma + Kysely ·
PostgreSQL 16 (pg_trgm/pg_bigm) · Auth.js v5 · BullMQ + Redis · S3/MinIO ·
Turborepo + pnpm.

## 구조 (모노레포)

```
apps/web        Next.js 메인 앱 (RSC + Server Actions)
apps/worker     BullMQ 백그라운드 워커
packages/db     Prisma 스키마 + 마이그레이션 + 시드 + Kysely
packages/modules 도메인 비즈니스 로직
packages/ui     디자인 시스템 (Cool Slate + shadcn + HR 패턴)
packages/shared 공통 타입/zod/유틸
packages/config 공유 tsconfig / eslint
docker/         로컬 인프라 (Postgres + Redis + MinIO)
```

## 개발

```bash
pnpm install
pnpm docker:up      # Postgres + Redis + MinIO
pnpm db:migrate
pnpm db:seed        # 권한 카탈로그 / 공휴일 / 법정 휴가
pnpm dev            # web(3000) + worker
```

## Phase 로드맵

P1 Foundation(인증/가입/권한) → P2 Core HR → P3 휴가 → P4 워크플로우+검색(⌘K) →
P5 채용 → P6 문서/보안 → P7 P1기능 → P8 확장.
