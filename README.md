# Teamlet

한국형 HR SaaS — 구성원 관리 · 휴가 · 전자결재를 하나로.

> 기획/분석/설계 문서: [`/docs`](./docs)  
> Claude Code 작업 지침: [`CLAUDE.md`](./CLAUDE.md)  
> 세션별 진행 상황: [`PROGRESS.md`](./PROGRESS.md)

## 스택

| 레이어 | 기술 |
|---|---|
| 프레임워크 | Next.js 15 (App Router · RSC · Server Actions · Turbopack) |
| 언어 | TypeScript strict |
| 스타일 | Tailwind v4 · Cool Slate 디자인 시스템 |
| DB ORM | Prisma + Kysely · PostgreSQL 16 |
| 인증 | Auth.js v5 (Credentials + Google OAuth) |
| 큐·캐시 | BullMQ + Redis |
| 스토리지 | S3 / MinIO |
| 모노레포 | Turborepo + pnpm workspaces |

## 구조

```
apps/web         Next.js 메인 앱
apps/worker      BullMQ 백그라운드 워커
packages/db      Prisma 스키마 + 시드 + Kysely 타입
packages/modules 도메인 비즈니스 로직
packages/ui      디자인 시스템
packages/shared  공통 타입 / Zod 스키마
docker/          로컬 인프라 (Postgres + Redis + MinIO)
```

## 빠른 시작

```bash
pnpm install
pnpm docker:up        # Postgres + Redis + MinIO
pnpm db:push          # 스키마 적용
pnpm db:seed          # 권한 카탈로그 + 데모 계정 생성
pnpm dev              # http://localhost:3000
```

> **앱 서버**: `http://localhost:3001` (포트 3001 고정)

**데모 계정** (비밀번호: `Test1234!`)

| 계정 | 역할 | 확인 시나리오 |
|---|---|---|
| `admin@teamlet.test` | 최고 관리자 + 조직장 | 결재함 → emp 휴가 승인, 구성원 관리 |
| `hr@teamlet.test` | 팀원 (DEFAULT) | 휴가 14일 잔여 (과거 1일 사용) |
| `emp@teamlet.test` | 팀원 (DEFAULT) | 연차 1건 결재 대기 중 |
| `platform@teamlet.test` | 플랫폼 총관리자 | `/admin` 콘솔 — 회사 신청 승인, 사용자 관리 |

> **환경 변수**: `apps/web/.env.local` 필요. `.env.example` 참고.  
> **플랫폼 관리자**: `SYSTEM_ADMIN_EMAILS=platform@teamlet.test` (`.env.local` 설정됨)

## 구현 현황

> ⚠️ 타입체크 통과 기준. 런타임 검증은 시나리오 테스트로 진행 중.

### 지금 쓸 수 있어요

| 기능 | 비고 |
|---|---|
| 이메일 로그인 | 2FA(TOTP) 설정 포함 |
| 회사 등록 신청 → 플랫폼 관리자 승인 | 데모 모드: `TEAMLET_DEMO_AUTO_APPROVE=true` 시 즉시 승인 |
| 플랫폼 운영 콘솔 (`/admin`) | 회사 신청 승인·반려, 회사·사용자 목록 |
| 구성원 디렉토리 · 상세 · 검색 | 부서 사이드바, 상태 탭, 테이블 뷰 |
| 인사 발령 이력 | 등록 시 HIRE 자동 생성 |
| 휴가 신청 · 승인 · 반려 · 취소 | 결재 인프라 연동 |
| 전자결재 결재함 · 순차 결재선 | 휴가 외 범용 양식 지원 |
| 역할 · 권한 매트릭스 | RBAC + 범위(전사/부서) |
| 채용 공고 · 후보자 칸반 | |
| 개인·회사 설정 | 보안 정책, 2FA QR 등록 |
| 홈 대시보드 | 결재 대기 · 휴가 잔여 |

### 다음에 할 일

| 항목 | 비고 |
|---|---|
| 홈 대시보드 고도화 | 홈피드·할일·캘린더 패널 (Flex 레퍼런스) |
| 휴가 도메인 UX | 내 휴가 카드 + 팀 캘린더 |
| 전자결재 UX | 결재 단계 시각화 |
| 연차 자동 부여·소멸 | Worker skeleton만 존재, 수동 부여만 동작 |
| 파일 업로드 · 이메일 발송 | S3/Resend 미연동 |
| 실시간 알림 | SSE/WebSocket 미적용 |
| 모바일 반응형 | 데스크톱 기준 |

## 설계 원칙

- **Result 패턴**: 도메인 함수 → `Result<T>` (`ok(data)` / `err(errors.xxx())`)
- **권한 가드**: 모든 mutation에서 `assertPermission` — RBAC + Scope
- **멀티 테넌시**: `UserRole`은 `employeeId` 기준 (회사별 신분)
- **Anti-Pattern**: `updateEmployee` 직접 호출 금지 — 항상 `Appointment` 경유
- **데모 모드**: `TEAMLET_DEMO_AUTO_APPROVE=true` — 회사 신청 즉시 승인 (운영 시 비활성)
