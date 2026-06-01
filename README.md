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

> 2026-05-29 전체 코드 감사 기준. 상세·증거는 **`docs/07_감사보고서_2026-05-29.md`** 참조.
> 원칙: **토대(보안·배포·정합성) → flex-parity 기능 → 차별화**. 깨진 토대 위에 기능 쌓지 않기.

> ✅ **2026-06-01 해소**: C6(증명서 인쇄)·C7(결재정책 자동배정)·H3(CC cross-tenant)·H5(공지 작성 권한)·H8(CSV HIRE 발령). H9(락아웃)는 이미 해소 확인. — 전부 타입클린/런타임 미검증.

**0순위 — 남은 CRITICAL (토대 마무리)**

| 항목 | 내용 |
|---|---|
| C5 Worker | `apps/worker` BullMQ 잡 프로세서 0개 — 연차 자동부여·소멸 스케줄 등록 |

**1순위 — 남은 HIGH (보안·정합성, §2 참조)**

| 항목 | 내용 |
|---|---|
| IP 제한·강제 2FA | UI/DB만 존재, 런타임 강제 전무 → 미들웨어 적용 or "준비중" 표기 |
| 휴가 잔여 계산 통일 (H6) | 표시(PENDING 미차감) ≠ 신청검증(PENDING 차감) |
| finalize 트랜잭션 (H7) | finalize가 워크플로우 트랜잭션 외부 호출 → 크래시 시 정합성 깨짐 |

**2순위 — flex-parity 신규 기능 (명세 §7-A 구조적 결손)**

| 항목 | 내용 |
|---|---|
| 근태(Attendance) 모듈 | 명세 곳곳의 근무시간(32:14/40h)·근무중 타이머 — 모듈 자체 없음 |
| 연차 사용 촉진 | 4-칸반(대기/진행/완료/종료) — 근로기준법 필수, C3 소멸엔진과 연결 |
| 워크플로우 인라인 결재 | 리스트에서 승인/반려 + 결재선 spine 시각화 |
| 설정 3종 실구현 | 보안(세션관리)·알림(채널 영속화)·회사정보(로고 ✅ 업로드 연결됨) |
| 파일 업로드 | 🟡 MinIO 인프라 + 문서함·로고 연결됨(타입클린·런타임 미검증). 남음: 프로필·증명서PDF·이력서 |

**3순위 — 차별화(120%) & 품질**

| 항목 | 내용 |
|---|---|
| 테스트 인프라 | vitest — 휴가 잔여·소멸·결재 트랜잭션 회귀 (현재 0건) |
| AxHub 구성원 sync | `axhubExternalId` upsert + `syncLockedFields` 우회 금지, Worker 스케줄 |
| 다크모드·5 accent | 토큰만 존재 → 테마 스위처 |
| 모바일 반응형 | 사이드바→햄버거, 레일→하단탭 |

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

### 2026-05-29 금요일

오늘은 디자인 전사 파일을 기반으로 현재 구현된 화면과 디자인 스펙 간 갭을 체계적으로 분석했습니다. 총 30개 화면 중 실제로 구현된 것과 껍데기만 있는 것을 코드 수준에서 직접 확인해 우선순위를 정리했고, 홈 페이지부터 차근차근 디자인에 맞춰나가는 방식으로 개발 방향을 설정했습니다. 오늘 작업의 핵심은 "무엇을 만들어야 하는가"를 명확히 정의하는 것이었고, 실제 구현은 홈 페이지 기능 보강부터 시작했습니다.

**[Teamlet]**
☑ 인증 방식 복구: 이메일 전용 → 이메일+비밀번호 2-step 로그인
☑ 디자인 갭 분석: 30개 화면 전수 조사, 미구현 12개 · 부분 구현 3개 우선순위 확정
☑ 홈 페이지 기능 보강: 오늘의 팀 현황 위젯, 생일·입사기념일·신규합류 이벤트 카드, 축하 보낼 동료 레일 위젯
☑ 휴가·구성원 다음 개발 우선순위 설계

**[Teamlet · 오후 — 전체 감사 + CRITICAL 수정]**
오후에는 6개 도메인 병렬 코드 감사로 "구현됨 vs 검증됨 vs 껍데기"를 실제 코드 수준에서 가려냈습니다. PROGRESS의 "완료" 표기와 실제 상태 사이 격차를 `docs/07_감사보고서`에 정리하고, 최우선 CRITICAL 4건을 바로 수정했습니다.
☑ 전체 감사 보고서 작성: CRITICAL 9건 + HIGH + 명세 갭 + 100→120% 로드맵 (`docs/07_감사보고서_2026-05-29.md`)
☑ C1 멀티테넌트 IDOR 차단: 경력·학력·가족 12함수에 회사 격리 + scope 컨텍스트 (`employee/career.ts`)
☑ C2 Docker 배포 복구: turbopack→webpack(`build:standalone`), `.dockerignore` 신규, 누락 패키지 복사 → **이미지 빌드 + 컨테이너 기동(307) 실측 검증**
☑ C3 연차 소멸·이월 멱등성: `LeaveBalance.expiryProcessedAt` 마커로 year별 1회 보장 + adjustedDays→grantedDays 차감
☑ C4 가입 신청 알림 복구: 권한(member.directory.manage) 기준 대상화 + 잘못된 필터/deepLink 교정
☑ 부수: `MembershipStatus.REJECTED` 추가(반려기능 복구) + bulk.ts import → 모듈 타입체크 전체 클린, dev DB db push 적용
※ C2 외 런타임 미검증(타입체크 통과). 남은 CRITICAL: C5(Worker)·C6(증명서)·C7(결재정책)

---

### 2026-05-30 토요일 (예정)

**[Teamlet]**
☐ 홈 페이지 나머지: 소식 탭 · 할 일 탭 완성
☐ 구성원 상세 디자인 기준 재정비 (Quick chips · 7아코디언 · 우측 레일)
☐ 휴가 관리 빈탭 채우기 (사용 내역 · 촉진 칸반)
☐ 설정 보안 (활성 세션 목록 · 강제 로그아웃)

---

### 6월 1일 일요일

[HR 웹 기능 개발]
☑ 토대 마무리 (결재정책 자동배정·증명서 인쇄·CC 보안·공지 권한·CSV 발령)
☑ 파일 업로드(MinIO) + 회사 문서함·로고 연결
☑ Flex/docs09 휴가 도메인 통합 설계 (Opus) — 스키마 step0 완료
☑ 맞춤 휴가 설정 완성 — useUnit·ccEmployeeIds·추가설정 저장 (Zod 스키마 신규 필드 포함)
☑ 휴가 신청 모달 완성 — 단일/다일 날짜 구분, 증명 자료 업로드, 승인자 고정 표시
☑ 연차 설정 (#3) — policy.ts 14개 신규 필드, 부여방식·소멸·사용단위·당겨쓰기 UI
☑ 퇴직자 조정 + 연차 촉진 설정 (#4) — CompanyLeaveSettings 모듈/모달
☑ 연차 자동부여 개선 — 전체 구성원 기본 정책 fallback, 법정 연차 계산
☑ 결재 문서 증명 자료 링크 표시 (승인자 화면에서 첨부파일 확인 가능)

---

### 6월 2일 월요일 (예정)

[HR 웹 기능 개발]
☐ 연차 정책 승인자 저장 런타임 검증 (Zod 스키마 수정 → 실제 DB 반영 확인)
☐ 연차 자동부여 전체 구성원 적용 검증
☐ 내 휴가 신청이력 탭 완성도 (상태별 필터 + 취소 버튼)
☐ 휴가 관리(관리자) 4탭 — 보유현황 side sheet / 월별 연차 / 촉진 탭
☐ 연차 사용계획 피드 (촉진 응답)
