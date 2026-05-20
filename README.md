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

## 진행 이력

### 2026-05-20 — P2 완료 + P3 휴가 도메인 착수

**P2 Core HR (완료)**
- 구성원 디렉토리 + 검색 (디바운스 + URL `?q=`) + 부서 사이드바 필터
- 부서 CRUD (추가 / 이름 변경 / soft 삭제)
- 직원 상세 + 수정 Dialog + 퇴직(비활성화) 처리
- Position 모델 + 직원 직책 배정 UI
- 권한 평가 + 시스템 역할 3종 + SUPER_ADMIN 전권한 부트스트랩
- 데모 자가-승인 플로우 (TEAMLET_DEMO_AUTO_APPROVE)

**P3 휴가 도메인 — DB + 모듈 레이어 (이번 세션)**
- Prisma 스키마: `CompanyHoliday` + `LeaveTransaction` 추가, `LeaveTxCategory` / `LeaveTxType` enum 신규
- 마이그레이션 `4_leave_domain` 적용
- `packages/modules/src/leave/` 신규: `bootstrap` (법정 8종 LeaveType 부트스트랩) · `balance` (잔여 조회 / 부여 / 조정) · `request` (신청 / 승인 / 반려 / 취소)
- 회사 승인 흐름(`tenancy/approval.ts`)에 `bootstrapCompanyLeaveTypes` 연결
- Server Actions(`apps/web/src/lib/actions/leave.ts`) 신규
