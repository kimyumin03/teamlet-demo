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

**데모 계정** — 이메일 + 비밀번호 로그인 (2-step)

| 계정 | 역할 | 비고 |
|---|---|---|
| `admin@teamlet.test` | 최고 관리자 | 비밀번호: `Test1234!` |
| `hr@teamlet.test` | HR 담당 | 비밀번호: `Test1234!` |
| `emp@teamlet.test` | 일반 사원 | 비밀번호: `Test1234!` |
| `platform@teamlet.test` | 플랫폼 관리자 | 비밀번호: `Test1234!` + 비밀키: `teamlet-admin-2024` |

> **데모 회사코드**: `DEMO-0001`  
> **환경 변수**: `apps/web/.env.local` 필요. `.env.example` 참고.

## 도메인 구조

| 도메인 | 경로 | 주요 기능 |
|---|---|---|
| 인증/가입 | `/login` `/signup` `/join-company` `/register-company` | 이메일 전용 로그인, 회사코드 가입, 회사 등록 신청 |
| 홈 | `/home` | 결재 대기 · 휴가 잔여 · 팀 캘린더 |
| 구성원 | `/members` | 디렉토리 · 상세 · 조직도 · CSV |
| 휴가 | `/leave` | 신청 · 승인 · 잔여 현황 |
| 전자결재 | `/workflow` | 결재함 · 양식 · 순차 결재 |
| 채용 | `/recruitment` | 공고 · 후보자 칸반 |
| 문서 | `/documents` | 문서 보관 · 증명서 발급 |
| HR 관리 | `/hr/leave` | 전사 휴가 현황 · 맞춤 부여 |
| 설정 | `/settings/*` | 프로필 · 역할 · 권한 · 정책 |
| 플랫폼 관리 | `/admin` | 회사 신청 승인 · 사용자 관리 (비밀키 2단계 인증) |

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
- **데모 모드**: `TEAMLET_DEMO_AUTO_APPROVE=false` — 플랫폼 관리자가 수동 검토

---

## 데일리 스크럼

### 2026-05-28 목요일

**[Teamlet]**
☑ Claude 디자인 파일 기반 전체 UI 전면 교체 (design.css 브리지 + Tailwind CSS 변수 직접 적용)
☑ 인증 6개 페이지 AuthCard 컴포넌트 기반 통일 (login 2-step 흐름, signup, 2fa, join-company, register-company, pending-approval)
☑ 앱 레이아웃 · 사이드바 디자인 구조 교체 (.app/.main 그리드, .side/.nav-item)
☑ 메인 5개 페이지 디자인 교체 (home, members, workflow, hr/leave, leave)
☑ 설정 레이아웃 2-col 구조 + 알림 설정 페이지 신규 구현
☑ HomeRail 오늘 자리비움 실데이터 연결 (listTeamLeaveCalendar)
☑ teamlet 컴포넌트 라이브러리 추가 (AuthCard, KpiCard, DataTable, Tag 등)

---

### 2026-05-29 금요일 (예정)

**[Teamlet]**
☐ 디자인 대비 미구현 기능 목록 분석 및 우선순위 설계
☐ AxHub 연동 설계 — 구성원·회사 데이터 sync 정합성 정의 (`sync_locked_fields` 범위 확정)
☐ HomeRail 축하 보낼 동료 위젯 (생일·입사기념일 실데이터 연결)
☐ 반려된 휴가 신청 재신청 기능 구현
☐ 활성 세션 목록 + 강제 로그아웃 (settings/security)
