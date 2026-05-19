# Teamlet — Claude Code 작업 지침

> 풀스펙 한국형 HR SaaS. 목표 = **Flex 대체** (간소화 ❌).
> 상세 스펙은 `/docs/00`~`/docs/06` 참조. 매 세션 이 파일이 자동 로드됨.

## 🎯 5가지 원칙 (절대 잊지 말 것)

1. **UX/UI 사용자 중심** — 기능보다 사용 경험이 우선
2. **Flex 카피 금지** — 패턴은 차용하되 적절한 변주 필수
3. **목표 = Flex 대체** (간소화 ❌) — 풀스펙·고완성도, SaaS 대체 수준
4. **범용성** — 대부분 한국 기업이 쓸 수 있어야 함
5. **컬러 차별화** — Flex의 초록→청록 그라데이션 금지. Cool Slate 팔레트만

## ❌ Anti-Patterns (절대 하면 안 되는 것 — `/docs/04` §7)

1. `UPDATE employees SET position=...` 금지 — 항상 새 `PositionHistory` row 추가
2. 휴가 일수 하드코딩 금지 — 모든 정책은 `LeavePolicy` 테이블에서
3. 권한 체크 없는 mutation 금지 — 모든 진입점에 `assertPermission`
4. `localStorage` 사용 금지 — 항상 서버 상태
5. 그라데이션 / 임의 컬러 금지 — 디자인 토큰만 (`bg-primary`, `text-foreground`)
6. `any` 타입 금지 — 명시적 타입 또는 `unknown`
7. 단일 회사 가정 하드코딩 금지 — 모든 쿼리에 `companyId` 필터
8. Audit log 누락 금지 — 도메인 mutation은 항상 `auditLog.record()`
9. Flex UI 직접 카피 금지 — 패턴은 차용, 시각·텍스트는 우리 것
10. 결재선 컴포넌트 중복 구현 금지 — `RecipientPicker` 재사용 (4곳)
11. 벌크 처리 우회 금지 — CSV라도 `BulkOperation`+`BulkOperationRow` 경유. `prisma.employee.createMany()` 직접 호출 금지
12. `sync_locked_fields` 우회 수정 금지 — AxHub 관리 필드는 수기 UI 차단 + Server Action 검증

## 🏗 아키텍처

- **모노레포**: pnpm + Turborepo
- `apps/web` — Next.js 15 App Router (RSC + Server Actions), Tailwind v4
- `apps/worker` — BullMQ 워커 (알림/연차자동부여/소멸/촉진/정리)
- `packages/db` — Prisma 스키마 + 마이그레이션 + 시드 + Kysely
- `packages/modules` — 도메인 비즈니스 로직 (auth/tenancy/employee/leave/workflow/...)
- `packages/ui` — 디자인 시스템 (Cool Slate 토큰 + shadcn 베이스 + HR 패턴 컴포넌트)
- `packages/shared` — 공통 타입/zod 스키마/유틸 (날짜·한국비즈니스·IP)
- `packages/config` — 공유 tsconfig / eslint

## 📐 코딩 컨벤션 (`/docs/04` §3)

- 디렉토리 `kebab-case`, React 컴포넌트 `PascalCase.tsx`, 그 외 `kebab-case.ts`
- 인터페이스 접두사 `I` **금지** (`Employee` not `IEmployee`)
- 클라이언트 컴포넌트만 명시적 `"use client"` — 기본은 서버 컴포넌트
- **Server Action** = 폼/mutation, **Route Handler** = Webhook/외부API/파일
- 에러: never throw raw — `Result<T,E>` 또는 도메인 에러. API 응답 `{ ok, data } | { ok:false, error }`
- 권한: 모든 mutation 진입점에 `await assertPermission(user, 'key', { companyId })`
- 시점 쿼리: `getEmployeePositionAt(id, date)` vs `getCurrentPosition(id)` 구분
- 커밋: Conventional Commits + 도메인 prefix (`feat(leave): ...`)

## 🔑 핵심 설계 결정

- **시점 기반 이력**: 모든 인사 변경 = 새 row + `Appointment` 트랜잭션. UPDATE 금지
- **멀티 테넌시**: `User`(인증) ↔ `Company` 다대다(`UserCompanyMembership`), `Employee`=회사별 신분
- **권한**: RBAC + Scope(전체/부서/직속/본인) + 동적 역할(조직장) + `EffectivePermission` 캐시
- **워크플로우 통합**: 휴가/공지/할일/정보변경 모두 `FormDocument.document_kind` + `ApprovalPolicy.category`
- **AxHub Adapter**: 외부 의존성은 인터페이스 추상화 (수기 ↔ API 무중단 전환)
- **검색**: pg_trgm + pg_bigm (한국어 형태소), ⌘K 커맨드 팔레트 + Claude Haiku AI 명령

## 🎨 디자인 (`/docs/05`)

- Primary = Slate 900 단색 (그라데이션 X), Accent = Cool Blue 600, 폰트 = Pretendard
- 컬러는 **토큰만** (`@theme` 정의). 임의 hex / `bg-green-500` / `from-* to-*` 금지
- 아이콘 = Lucide. 큰 컬러풀 아이콘 카드 금지 (Flex 시그니처)
- 11개 핵심 컴포넌트는 `packages/ui/patterns/` — 재사용 강제

## ⚙️ 개발 워크플로우

```
pnpm install
pnpm docker:up        # Postgres + Redis + MinIO
pnpm db:migrate
pnpm db:seed          # 권한 카탈로그 / 공휴일 / 법정 휴가
pnpm dev              # web + worker
```

- **Vertical Slice**: DB 마이그레이션 → 모듈 → Server Action → UI 를 기능 단위로
- MVP 속도 우선 — 바이브 코딩 (TDD 사이클 생략, 핵심 도메인만 선택적 테스트)

## 📋 Phase 로드맵

P1 Foundation(인증/가입/권한) → P2 Core HR(직원/조직/이력) → P3 휴가 → P4 워크플로우+검색 → P5 채용 → P6 문서/보안 → P7 P1기능 → P8 확장
