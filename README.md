# Teamlet

> **풀스펙 한국형 HR SaaS** — 구성원 · 조직 · 휴가 · 전자결재 · 채용 · 문서를 하나로.
> 목표는 **Flex 대체**: 간소화가 아니라 풀스펙·고완성도의 SaaS 대체 수준.

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black">
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6">
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-PostgreSQL-2D3748">
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-v4-38BDF8">
</p>

한국 **근로기준법**(연차 부여 §60 · 사용 촉진 §61 · 법정휴가)을 정확히 반영한 멀티테넌트 인사관리 플랫폼입니다. **시점 기반 인사 이력**, **RBAC + Scope 권한**, **통합 전자결재**, **⌘K 명령 팔레트**를 갖췄습니다.

🔗 **라이브 데모**: <https://teamlet-app.jocodingax.axhub.ai> · 계정은 [데모 계정](#-데모-계정) 참고
📄 기획·분석·설계: [`/docs`](./docs) · 작업 지침: [`CLAUDE.md`](./CLAUDE.md) · 진행 기록: [`PROGRESS.md`](./PROGRESS.md)

---

## ✨ 주요 기능

### 🔐 인증 · 멀티테넌시
- 이메일 **2-step 로그인** + Google OAuth + **TOTP 2FA**
- `User`(인증) ↔ `Company` **다대다 멤버십** — 회사별 신분 = `Employee`
- 회사 등록 신청 → **플랫폼 관리자 콘솔**(`/admin`, 2단계 비밀키 인증)에서 승인
- 회사코드 가입 신청 → HR 승인 플로우

### 🛡 권한 (RBAC + Scope)
- 역할 기반 권한 + **범위**(전체 / 부서 / 직속 / 본인) + **동적 역할**(조직장)
- 권한 매트릭스 운영 UI, 실사용 24개 권한 카탈로그, `EffectivePermission` 캐시
- 모든 mutation 진입점에 `assertPermission` 가드 강제

### 👥 구성원 · 조직 · 인사이력
- 구성원 디렉토리(부서 사이드바 · 재직상태 탭 · 테이블) + 상세(3탭 · 확장 프로필)
- **조직도 시각화**, CSV 일괄 등록/내보내기 (`BulkOperation` 경유)
- **시점 기반 인사 발령 이력** — `UPDATE` 금지, 변경은 항상 새 `Appointment` row

### 🌴 휴가 (근로기준법 정밀 반영)
- 법정 휴가 **자동 등록**(연차 · 보상 · 출산전후 · 난임 등) + 맞춤 휴가 동적 설정
- **연차 자동부여 엔진** — 1년 미만 월 1일 누적(§60②), 1년+ 법정 테이블, 소멸·이월 정책
- 휴가 신청 모달(듀얼 캘린더 · 반차/시간차 · 날짜별 상세 일정) → **전자결재 연동**
- **연차 사용 촉진(§61)** 엔진 + worker cron — 회계일/입사일 기준 법정 소멸일 자동 계산
- 관리자 휴가 관리 4탭(보유현황 · 사용내역 · 월별연차 · 촉진) + **엑셀 다운/업로드**
- 법정공휴일 **자동 등록** (공공데이터 특일정보 API)

### 📋 전자결재 (워크플로우)
- 통합 `FormDocument.document_kind` — 휴가 · 정보변경 · 공지 · 할일을 **하나의 결재 인프라**로
- **순차 결재선** + 결재 정책 자동 배정(특정인 / 부서장 / 조직장)
- 참조자(CC) + 알림, 결재함 3탭(결재 대기 / 내가 요청 / 완료·참조)

### 🧩 그 외
- **채용** — 공고 + 후보자 칸반 + 전형 단계 + 메모
- **문서·증명서** — 회사 문서 보관소 + 재직/경력 증명서 발급·인쇄
- **알림** — 인앱 알림 + SSE 실시간 구독 + 알림 센터
- **검색** — ⌘K 커맨드 팔레트(구성원 검색 + 권한별 페이지 네비)
- **홈** — 피드 · 회사 소식 · 인정/피드백 · 팀 휴가 캘린더
- **데모 모드** — `DEMO-0000` 온보딩 체험(빈 회사 직접 설정, 로그아웃 시 자동 초기화) / `DEMO-0001` 풍부한 데이터

---

## 🛠 기술 스택

| 레이어 | 기술 |
|---|---|
| 프레임워크 | Next.js 15 (App Router · RSC · Server Actions · Turbopack) |
| 언어 | TypeScript (strict) · React 19 |
| 스타일 | Tailwind v4 · **Cool Slate** 디자인 토큰 · Pretendard · Lucide |
| DB / ORM | PostgreSQL · Prisma (+ Kysely) · pg_trgm / pg_bigm 한국어 검색 |
| 인증 | Auth.js v5 (Credentials + Google OAuth + TOTP) |
| 큐 · 캐시 | BullMQ + Redis (알림 · 연차 자동부여/소멸/촉진 cron) |
| 스토리지 | S3 / MinIO |
| 모노레포 | Turborepo + pnpm workspaces |

---

## 🏗 아키텍처

```
apps/
  web/         Next.js 메인 앱 (RSC + Server Actions)
  worker/      BullMQ 백그라운드 워커 (알림·연차 cron)
packages/
  db/          Prisma 스키마 + 마이그레이션 + 시드 + Kysely 타입
  modules/     도메인 비즈니스 로직 (auth/tenancy/employee/leave/workflow/...)
  ui/          디자인 시스템 (Cool Slate 토큰 + shadcn 베이스 + HR 패턴)
  shared/      공통 타입 / Zod 스키마 / 유틸 (날짜·한국비즈니스·IP)
  config/      공유 tsconfig / eslint
docker/        로컬 인프라 (Postgres + Redis + MinIO)
docs/          기획·분석·설계 SSOT (00~09 + 감사보고서)
```

### 핵심 설계 결정
- **시점 기반 이력** — 모든 인사 변경 = 새 row + `Appointment`. `UPDATE`로 직책/부서 덮어쓰기 금지.
- **멀티 테넌시** — `User`(인증) ↔ `Company` 다대다, `Employee` = 회사별 신분. 모든 쿼리에 `companyId` 필터.
- **통합 워크플로우** — 휴가·공지·할일·정보변경을 `FormDocument` + `ApprovalPolicy`로 단일화.
- **에러 처리** — never throw raw. 도메인 함수는 `Result<T, E>`, API 응답은 `{ ok, data } | { ok: false, error }`.
- **감사 로그** — 도메인 mutation은 항상 `auditLog.record()`.

---

## 🎨 디자인 — Cool Slate

Flex의 초록→청록 그라데이션을 배제한 **단색 Cool Slate** 팔레트. Primary = Slate 900, Accent = Cool Blue 600.

1. **UX/UI 사용자 중심** — 기능보다 사용 경험 우선
2. **Flex 카피 금지** — 패턴은 차용, 시각·텍스트는 우리 것
3. **풀스펙** — 간소화 ❌, SaaS 대체 수준
4. **범용성** — 대부분의 한국 기업이 쓸 수 있게
5. **컬러 토큰만** — 임의 hex / 그라데이션 금지 (`bg-primary`, `text-foreground` 등 `@theme` 토큰)

---

## 🚀 빠른 시작 (로컬 개발)

```bash
pnpm install
pnpm docker:up        # Postgres + Redis + MinIO
pnpm db:push          # 스키마 적용
pnpm db:seed          # 권한 카탈로그 + 법정휴가/공휴일 + 데모 계정
pnpm dev              # http://localhost:3001 (포트 고정)
```

> 환경 변수는 `apps/web/.env.local` — [`.env.example`](./.env.example) 참고.
> 빌드는 **Turbopack** 사용(`--turbopack`). 워크스페이스 상대 import는 확장자 없이.

---

## ☁️ 배포 (axhub)

라이브 앱은 [axhub](https://axhub.ai) 플랫폼에 Docker로 배포돼 있습니다. axhub 빌더의 메모리 제약(OOM)을 우회하기 위해 **사전 빌드 산출물 배포** 방식을 씁니다:

1. 로컬에서 `docker build` → Next.js standalone 산출물 생성
2. 산출물을 `prebuilt.tar.gz`로 묶어 **`axhub-deploy` 브랜치**에 커밋 (COPY-only Dockerfile = 압축해제 후 실행만)
3. `axhub deploy create` → axhub 빌더는 빌드 없이 패키징만 수행

DB는 외부 5432 차단 우회를 위해 **Neon serverless 드라이버**(443/WebSocket)로 연결합니다. 자세한 절차는 [`PROGRESS.md`](./PROGRESS.md) 참고.

---

## 🔑 데모 계정

> ⚠️ 데모 전용 자격증명입니다. 이메일 + 비밀번호 2-step 로그인.

| 계정 | 비밀번호 | 역할 | 회사 |
|---|---|---|---|
| `demo@teamlet.io` | `Demo1234!` | 최고 관리자 (온보딩 체험) | `DEMO-0000` |
| `admin@teamlet.test` | `Test1234!` | 최고 관리자 | `DEMO-0001` |
| `hr@teamlet.test` | `Test1234!` | HR 담당 | `DEMO-0001` |
| `emp@teamlet.test` | `Test1234!` | 일반 사원 | `DEMO-0001` |
| `platform@teamlet.test` | `Test1234!` + 비밀키 `teamlet-admin-2024` | 플랫폼 관리자 (`/admin`) | — |

- **DEMO-0000** — 빈 신규 회사(구성원·조직만). 휴가종류·정책·공휴일·결재는 체험자가 버튼으로 직접 설정하며 온보딩 체험. **로그아웃 시 자동 초기화**.
- **DEMO-0001** — 구성원·휴가·결재·공지가 채워진 **기능 시연용** 데이터.
- 라이브 앱은 axhub private 앱(SSO 게이트)이라 외부 접속 시 axhub 로그인을 먼저 거칩니다.

---

## 🗺 로드맵

| Phase | 영역 | 상태 |
|---|---|---|
| P1 | Foundation — 인증 · 가입 · 권한 | ✅ |
| P2 | Core HR — 구성원 · 조직 · 발령 이력 | ✅ |
| P3 | 휴가 — 신청 · 정책 · 자동부여 · 촉진 | ✅ |
| P4 | 워크플로우 + 검색 | ✅ |
| P5 | 채용 | ✅ |
| P6 | 문서 · 증명서 · 보안 | ✅ |
| P7 | 확장 프로필 · 보안 강화(2FA · 세션) | 🟡 |
| P8 | 알림 · AxHub 연동 · 근태 모듈 | 🟡 |

> 활발히 개발 중인 MVP입니다. 도메인 로직은 타입체크 통과 기준이며, 런타임 검증은 시나리오 테스트로 진행 중입니다. 상세 현황·감사 결과는 [`PROGRESS.md`](./PROGRESS.md)와 [`docs/07_감사보고서`](./docs)를 참고하세요.

---

## 📚 문서

| 문서 | 내용 |
|---|---|
| [`/docs/00`~`06`](./docs) | 기획 · 도메인 명세 · 디자인 시스템 |
| [`/docs/07`](./docs) | 전체 코드 감사 보고서 |
| [`/docs/08`,`09`](./docs) | 휴가 도메인 Flex 갭 분석 · 통합 설계 |
| [`CLAUDE.md`](./CLAUDE.md) | 아키텍처 · 코딩 컨벤션 · Anti-Pattern |
| [`PROGRESS.md`](./PROGRESS.md) | 세션별 진행 기록 |
| [`PORTFOLIO.md`](./PORTFOLIO.md) | 프로젝트 포트폴리오 (기술적 도전 & 해결) |
