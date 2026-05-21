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
> `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 설정.

## 구현 현황 (2026-05-21 기준)

### ✅ 완료된 도메인

| 도메인 | 주요 기능 |
|---|---|
| **인증/가입** | 이메일·비밀번호 로그인, Google OAuth, 회원가입, 회사 등록 신청, 회사코드 가입, **직원 초대 링크** (`/invite/[token]`), 로그인 잠금, 감사 로그 |
| **권한** | 역할(Role) CRUD, 권한 카탈로그 (`member.directory.read` 등 키 체계), 역할 배정/해제, SUPER_ADMIN 부트스트랩, Scope 평가 |
| **Core HR** | 구성원 디렉토리 (검색·부서·상태·고용형태 필터), 직원 상세 탭 (정보/휴가/결재/문서/권한), 부서 CRUD, 직책 관리, CSV 가져오기/내보내기 |
| **휴가** | 휴가 종류 관리, 잔여·사용 집계, 신청/승인/반려/취소, 팀 캘린더, 정책(LeavePolicy) CRUD·배정, 수동 부여/조정 |
| **워크플로우** | 양식 빌더 (동적 필드), 문서 기안 3단계 위저드, 결재선 지정, 승인/반려 액션 |
| **채용** | 공고 CRUD·상태 필터, 전형 단계 관리, 후보자 목록/칸반 뷰, **후보자 상세** (단계이동·결과·메모) |
| **문서·증명서** | 문서 보관소, 증명서 발급·인쇄 |
| **보안** | 보안 정책, 감사 로그 (활동유형·이벤트 필터·텍스트 검색) |
| **알림** | 알림 벨 패널, `/notifications` 전용 페이지 (탭·읽음 처리) |
| **설정** | 회사 정보 수정, 공휴일 관리, 개인 프로필·비밀번호 변경 |
| **UX** | ⌘K 커맨드 팔레트 (구성원 검색 + 전체 페이지 네비), 홈 대시보드 |

### 🚧 미구현

| 항목 | 비고 |
|---|---|
| Worker (BullMQ) | 휴가 자동 부여, 비동기 알림 — skeleton만 존재 |
| 실시간 알림 | SSE 또는 WebSocket |
| 2FA TOTP | DB 컬럼만 있음 |
| 모바일 반응형 | 데스크톱 기준 구현 |

## 주요 설계 원칙

- **Result 패턴**: 모든 도메인 함수 `Result<T>` 반환 (`ok(data)` / `err(errors.xxx())`)
- **권한 키 컨벤션**: `<category>.<domain>.<action>` (예: `member.directory.read`)
- **Server Actions**: `toApiResponse()` 래퍼로 클라이언트에 전달
- **멀티 테넌시**: `UserRole`은 `employeeId` 기준 (회사별 신분)
- **데모 모드**: `TEAMLET_DEMO_AUTO_APPROVE=true` — 회사 신청 즉시 승인 (운영 금지)
