# Teamlet

풀스펙 한국형 HR SaaS — **Flex 대체** 목표 (간소화 ❌).

> 기획/분석/설계 문서: [`/docs`](./docs) (00 킥오프 → 06 화면 명세).  
> Claude Code 작업 지침: [`CLAUDE.md`](./CLAUDE.md) (5원칙 + Anti-Pattern 12개).  
> 세션별 진행 상황: [`PROGRESS.md`](./PROGRESS.md).

## 스택

| 레이어 | 기술 |
|---|---|
| 프레임워크 | Next.js 15 (App Router · RSC · Server Actions · Turbopack) |
| 언어 | TypeScript strict |
| 스타일 | Tailwind v4 · Cool Slate 디자인 시스템 |
| DB ORM | Prisma + Kysely · PostgreSQL 16 |
| 인증 | Auth.js v5 (Credentials + Google OAuth) |
| 큐·캐시 | BullMQ + Redis (Worker skeleton) |
| 스토리지 | S3 / MinIO |
| 모노레포 | Turborepo + pnpm workspaces |

## 구조 (모노레포)

```
apps/web         Next.js 메인 앱
apps/worker      BullMQ 백그라운드 워커 (skeleton)
packages/db      Prisma 스키마 + 마이그레이션 + 시드 + Kysely 타입
packages/modules 도메인 비즈니스 로직 (auth/leave/workflow/recruit…)
packages/ui      디자인 시스템 primitives + patterns
packages/shared  공통 타입 / Zod 스키마 / Result 패턴
packages/config  공유 tsconfig / eslint
docker/          로컬 인프라 (Postgres + Redis + MinIO)
```

## 빠른 시작

```bash
pnpm install
pnpm docker:up        # Postgres + Redis + MinIO
pnpm db:migrate       # 스키마 적용 (db push)
pnpm db:seed          # 권한 카탈로그 / 법정 휴가 시드
pnpm dev              # http://localhost:3000
```

> **환경 변수**: 루트 `.env` 파일 필요. `.env.example` 참고.  
> `AUTH_SECRET`, `DATABASE_URL`, `TEAMLET_DEMO_AUTO_APPROVE`,  
> `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SYSTEM_ADMIN_EMAILS` 설정.

## 구현 현황 (2026-05-22 기준)

> ⚠️ 아래 **구현 범위**는 *코드가 작성된* 영역입니다. 통합 검증은 부분적으로만
> 이루어져, 일부 기능은 실제 시나리오에서 동작하지 않을 수 있습니다.
> 검증·버그 수정은 아래 **최소 기능 scope**를 우선 대상으로 진행합니다.

### 🎯 최소 기능 scope (MVP 핵심)

데모·실사용의 골격. **반드시 끊김 없이 동작해야 하는 경로**이며, 검증·버그 수정의 1순위입니다.

| 경로 | 핵심 시나리오 |
|---|---|
| **인증** | 회원가입 → 회사 등록·가입 → 로그인 → 세션 유지 |
| **구성원** | 직원 등록 → 부서·직책 배정 → 디렉토리 조회·검색 |
| **휴가** | 휴가 신청 → 관리자 승인·반려 → 잔여 일수 반영 |

> 나머지 도메인은 **확장 기능**입니다 — 코드는 작성됐으나, 최소 scope 검증 이후 순차 점검합니다.

### 구현 범위 (코드 작성 완료 · 검증 전)

| 도메인 | 범위 | 구분 |
|---|---|---|
| 인증/가입 | 이메일 로그인, Google OAuth, 회사 등록·가입, 초대 링크 | 🎯 최소 |
| 구성원/조직 | 디렉토리·필터, 직원 상세, 부서·직책, CSV 입출력 | 🎯 최소 |
| 휴가 | 신청·승인·취소, 잔여 집계, 정책 CRUD, 팀 캘린더 | 🎯 최소 |
| 권한 | 역할 CRUD, 권한 매트릭스, Scope 평가, 도메인 가드 | 확장 |
| 워크플로우 | 양식 빌더, 문서 기안, 순차 결재선 | 확장 |
| 채용 | 공고·전형 단계, 후보자 칸반·상세 | 확장 |
| 문서·증명서 | 문서 보관소, 증명서 발급·인쇄 | 확장 |
| 보안·감사 | 보안 정책 CRUD, 감사 로그 | 확장 |
| 알림 | 알림 벨, 전용 페이지 | 확장 |
| 플랫폼 운영 | `/admin` 회사 신청 승인·통계 | 확장 |
| 설정·UX | 회사·개인 설정, ⌘K 팔레트, 홈 대시보드 | 확장 |

### 🚧 미구현 / 알려진 한계

| 항목 | 비고 |
|---|---|
| Worker (BullMQ) | 휴가 자동 부여·소멸, 비동기 알림 — skeleton만 존재 |
| 연차 자동 부여 | 정책 저장만, 현재 수동 부여만 동작 |
| 인사 발령 이력 | Appointment/PositionHistory 미구현 — `updateEmployee` 덮어쓰기 |
| 2FA / IP 제한 | 정책 저장·UI는 되나 로그인 강제 적용 미구현 |
| 실시간 알림 | SSE / WebSocket 미적용 |
| 파일 업로드·이메일 | S3 · 메일 발송 실연동 미구현 |
| 모바일 반응형 | 데스크톱 기준 구현 |

## 주요 설계 원칙

- **Result 패턴**: 모든 도메인 함수 `Result<T>` 반환 (`ok(data)` / `err(errors.xxx())`)
- **권한 키 컨벤션**: `<category>.<domain>.<action>` (예: `member.directory.read`)
- **권한 가드**: 모든 mutation 진입점에서 `assertPermission` 호출 — RBAC + Scope
- **Server Actions**: `toApiResponse()` 래퍼로 클라이언트에 전달
- **멀티 테넌시**: `UserRole`은 `employeeId` 기준 (회사별 신분). 플랫폼 운영자는 `SYSTEM_ADMIN_EMAILS`로 별도 식별
- **데모 모드**: `TEAMLET_DEMO_AUTO_APPROVE=true` — 회사 신청 즉시 승인 (운영 금지, 운영 시 `/admin`에서 수동 검토)

## 작업 로그

### 2026-05-21 (목)

- 권한 시스템 — 역할 배정·권한 매트릭스를 UI로 완성해 실사용 가능하게
- 보안 강화 — 도메인별 권한 가드 적용, 미적용 정책은 "준비 중" 표기
- 플랫폼 운영 콘솔 — 회사 가입 신청 승인·관리 기능 추가

### 2026-05-22 (금) 예정

- **인사 발령 이력** — 부서이동·승진을 시점별 이력으로 관리
- **휴가–전자결재 통합** — 휴가 신청을 결재 인프라와 연결
- **연차 자동 부여** — 정책 기반 자동 부여·소멸 엔진
