# 진행 상황

> 세션 시작 시 이 파일을 먼저 읽고, 작업이 끝나면 **다음에 할 일** 섹션을 업데이트하세요.
> 상세 스펙은 `CLAUDE.md` + `/docs` 참조.

## 전체 진행도 (2026-05-22 세션2 기준)

| 영역 | 상태 | 비고 |
|---|---|---|
| 명세서 `/docs` | ✅ 100% | 00~06 7종, 6,050 lines |
| DB 스키마 + 시드 | ✅ P1~P5 + 확장 | 마이그레이션 12개 (`0_init` ~ `12_google_oauth`) |
| Shared 패키지 | ✅ 스키마 확장 중 | schemas: 사원/정책/휴가/양식/회사/공휴일/프로필/비밀번호 |
| UI 시스템 | 🟡 기초만 | theme + primitives 3 / patterns 3 |
| **P1 인증/가입** | ✅ 완료 + 강화 | auth 모듈 + 화면 5개 + NextAuth + 데모 자가-승인 + Google OAuth + 초대 링크 + 로그인 IP/UA 기록 |
| **P1 권한** | ✅ 완료 | 평가/CRUD/UserRole/락아웃/부트스트랩 + isOrgHead 동적역할 + 권한 운영 UI(배정·매트릭스) ✓ |
| **P2 Core HR (구성원/조직/직책)** | ✅ 완료 | 탭 상세 + 확장 필드 + 상태/고용형태 필터 + CSV 일괄 등록 + 휴가·결재 탭 + **인사 발령 이력 탭** |
| **P3 휴가** | ✅ UI 완료 | /leave + 신청/취소 + 관리자 승인/반려 + 수동 부여 + 팀 캘린더 ✓ |
| **P3 휴가 정책** | 🟡 부분 | LeavePolicy CRUD·배정 + **연차 자동부여 엔진(MVP)** ✓ / 소멸·이월 미구현 |
| **P4 워크플로우** | ✅ MVP 완료 | /workflow + 3단계 위저드 + 순차 결재 강제 ✓ |
| **P4 양식 빌더** | ✅ 완료 | FormTemplate CRUD + 필드 편집 UI (`/settings/form-templates`) |
| **P5 채용** | ✅ 강화 완료 | 공고 목록 + 상태 필터 + 후보자 목록/칸반/상세 + 메모 ✓ |
| **구성원 CSV** | ✅ 완료 | 가져오기 + 내보내기 (`/api/members/export`) |
| **P6 문서·증명서** | ✅ MVP 완료 | /documents 보관소 + /documents/certificates 발급/인쇄 ✓ |
| **P7 보안** | 🟡 강화 | 보안 정책 CRUD + 감사 로그 ✓ / **TOTP 2FA 개인 설정·로그인 검증 구현** / IP 제한은 정책 저장만(강제 미적용) |
| **P8 알림** | ✅ 강화 완료 | 알림 벨 패널 + /notifications 전용 페이지 (탭/읽음 처리) ✓ |
| **회사 설정** | ✅ 완료 | 회사 정보 수정 + 공휴일 관리 |
| **개인 설정** | ✅ 완료 | /settings/profile — 프로필 수정 + 비밀번호 변경 |
| **⌘K 커맨드 팔레트** | ✅ 완료 | 구성원 검색 + 전체 페이지 네비게이션 |
| **홈 대시보드** | ✅ 완료 | 결재 대기 + 연차 잔여 + 최근 문서 + 알림 + 빠른 이동 |
| 도메인 권한 가드 | ✅ 완료 | 휴가/채용/증명서/문서/설정 모듈 assertPermission 적용 |
| **플랫폼 운영 콘솔** | ✅ 강화 완료 | `/admin` — 전용 콘솔 UI(dark sidebar) + 사용자 관리 + 회사 신청/목록/통계 |
| Worker | ⬜ 빈 skeleton | BullMQ 미구현 |

## 현재 위치

- **Phase**: P1~P8 + UX 고도화(구성원/어드민) + Flex 레퍼런스 기반 리디자인 진행 중
- **브랜치**: `main`
- **원격**: `https://github.com/kimyumin03/Teamlet.git`
- **마지막 커밋**: `e774f9c feat: 플랫폼 어드민 콘솔 UI 개편 + 사용자 관리 페이지`
- **dev 서버**: `http://localhost:3001` (포트 3001 고정)
- **마이그레이션**: 12개 + `appointments` 테이블 — db push 적용

## 다음 작업 후보 (Flex 비교 검토 2026-05-21 반영)

### ✅ 완료
- 도메인 권한 가드 일괄 추가 — 휴가/채용/증명서/문서/설정 `assertPermission`
- 워크플로우 순차 결재 버그 — step 건너뛰기 차단
- 권한 운영 UI — 역할 배정(구성원 상세) + 권한 매트릭스(`/settings/permissions/[roleId]`)
- 플랫폼 운영 콘솔 — `/admin` 회사 신청 승인/반려
- 착시 제거 — 로그인 IP/UA 실기록 + 2FA·IP·연차 정책 "준비 중" 표기
- 인사 발령 이력 — `Appointment` 모델 + 발령 등록/이력 탭 (updateEmployee 덮어쓰기 제거, Anti-Pattern #1 해소)
- 연차 자동부여 엔진(MVP) — 정책 기반 멱등 부여 + 첫 해 월할 비례, 관리자 수동 실행

### ✅ 완료 (추가)
- 휴가-워크플로우 통합 Bridge — `LeaveRequest.formDocumentId` FK + `requestLeave`가 FormDocument/ApprovalLine 동시 생성 + `approveDocument`/`rejectDocument` 최종 승인 시 `finalizeLeave*` 자동 호출 + 결재자 선택 UI
- 신규 직원 등록 시 HIRE 발령 자동 생성
- **TOTP 2FA** — `UserMFA` 모델 + `otplib` + 개인 설정 QR 설정 흐름 + 로그인 `mfaCode` 검증

### 🟡 다음 (UX 고도화 — Flex 레퍼런스 기반)
1. **홈 대시보드** — 홈피드 형식으로 고도화 (공지·할일·캘린더·인정 피드백 패널)
2. **휴가 도메인** — 내 휴가 현황 카드 + 신청 폼 UX + 팀 캘린더 뷰 개선
3. **전자결재** — 결재함 UI 고도화 (단계별 진행 상태 시각화)
4. **설정 도메인** — 각 설정 페이지 레이아웃 통일
5. **IP 제한 실적용** — IP 화이트리스트 강제 (락아웃 안전장치 포함)
6. **Worker(BullMQ)** — 휴가 자동 부여·소멸, 비동기 알림 / **실시간 알림** — SSE

### 🟢 LOW — 선택적 강화
- 채용 depth (지원서 양식·이력서 첨부·면접 일정·스코어카드)
- 파일 업로드(S3)·이메일 발송 실연동
- 모바일 반응형 (웹 우선이라 후순위)

## 최근 한 일

### 2026-05-22 세션2 — UX 고도화 + 플랫폼 어드민 콘솔 개편

**구성원 도메인 고도화 (Flex 레퍼런스)**
- `AppSidebar` 신규 — 도메인별 좌측 사이드바 (홈/구성원/휴가/전자결재/채용/문서/알림 + 설정 섹션)
- 구성원 목록 `/members` — 부서 사이드바(w-52) + 상태 탭 + 테이블 뷰 (아바타·상태 dot·고용형태·사번·입사일)
- 구성원 상세 `/members/[id]` — 그라디언트 아바타 헤더, 탭(정보/발령/휴가/결재), 휴가 progress bar
- `EmployeeDetail.leaveBalances` 타입 확장 (`granted`/`adjusted`/`used` 필드 추가)
- 앱 레이아웃 개편 — 로그아웃 버튼 + 커맨드 팔레트 + 알림 벨 헤더 통합

**플랫폼 어드민 콘솔 개편**
- `AdminSidebar` 신규 — `zinc-900` 다크 사이드바, 대기 신청 배지, 앱 이동 링크
- `/admin` 레이아웃 — 일반 앱과 완전 분리된 콘솔 스타일, 로그아웃 버튼
- `/admin` 대시보드 — 통계 카드 + 대기 신청 경보 배너 + 빠른 링크
- `/admin/users` 신규 — 플랫폼 전체 사용자 관리 (이메일 인증 상태, 소속 회사 수)
- `listAllUsers` 모듈 함수 추가

**버그 수정**
- 로그인 폼 hydration 에러 — 중첩 `<form>` 구조 수정 (Google OAuth form을 바깥으로 분리)
- Google OAuth 버튼 비활성화 (Cloud Console 설정 전까지)
- dev 서버 포트 3001 고정 + `.env.local` `AUTH_URL` 맞춤

**데모 시드 보완**
- `platform@teamlet.test` 계정 씨드 추가 (플랫폼 총관리자, `/admin` 접근)
- DEFAULT 역할 권한 추가 (`member.directory.read`, `leave.balance.read`, `workflow.document.read`)
- scrypt 해시 포맷 수정

### 2026-05-22 휴가-워크플로우 통합 Bridge
- `LeaveRequest.formDocumentId @unique` FK — schema + `db push` 완료
- `requestLeave`: FormDocument(LEAVE_REQUEST) + ApprovalLine(step 1) + LeaveRequest 를 하나의 `$transaction`으로 생성
- `finalizeLeaveFromApprovedDocument` / `finalizeLeaveFromRejectedDocument` — 결재 완료 시 LeaveRequest 상태 + 잔여일 처리
- `approveDocument` / `rejectDocument`: LEAVE_REQUEST 문서 최종 처리 시 finalize 자동 호출
- `approveLeave` / `rejectLeave`: formDocumentId 있으면 "결재함에서 처리" 가드 추가
- `listApproverCandidates` — 동일 회사 활성 구성원 (권한 불필요)
- `/leave` 페이지 + 신청 폼 — 결재자 선택 `<select>` 추가
- ⚠️ 런타임 미검증 (타입체크만 통과)

### 2026-05-22 인사 발령 + 연차 자동부여 + README 정직화
- 인사 발령 — `Appointment` 모델/모듈 + 구성원 발령 탭. updateEmployee 덮어쓰기 제거 (Anti-Pattern #1) → `69745c6`
- README `구현 현황` 정직화 + 🎯 최소 기능 scope(인증·구성원·휴가) 명시 → `f7a810f`
- 연차 자동부여 엔진(MVP) — `runAnnualLeaveGrant`: 정책 기반 멱등 부여 + 첫 해 월할 비례. 휴가 정책 페이지에 실행 버튼
- 최소 scope 검증 착수: 타입체크·빌드(코드) 통과. 런타임은 좀비 dev 서버 포트 점유로 보류 → 추후 재개
- ⚠️ 인사 발령·연차 모두 **런타임 미검증** (타입체크만 통과)

### 2026-05-21 보안 가드 + 권한 운영 UI + 플랫폼 콘솔 세션
- `d327ee4` 보안 — 착시 제거: 로그인 IP/UA 실기록 + 2FA·IP·연차 정책 "준비 중" 표기
- `a5dc298` 플랫폼 — 운영 콘솔 `/admin` (회사 신청 승인/반려 + 회사 목록 + 통계)
- `35cb23f` 권한 — 역할 권한 매트릭스 편집 UI (`/settings/permissions/[roleId]`)
- `d7b0026` 권한 — 구성원 상세 "권한" 탭에 역할 배정/해제 UI
- `00d5ae4` 보안 — 도메인 모듈 권한 가드 일괄 추가 (휴가/채용/증명서/문서/설정)
- `7060246` 워크플로우 — 순차 결재 강제, step 건너뛰기 버그 수정
- `9fe5a4d` 권한 — `Position.isOrgHead` → DYNAMIC_ORG_HEAD 권한 자동 주입 + DEPARTMENT scope
- Flex 대비 전체 갭 분석(4개 도메인 병렬 리뷰) 수행 → 작업 우선순위 재정렬

### 2026-05-21 CSV 내보내기 + 채용 후보자 상세
- `f4c5003` 구성원 CSV 내보내기 / `bf9fe1d` 채용 후보자 상세 + 메모
- `c4e5733` 구성원 휴가·결재 탭 / `eb9ff5f` 직원 초대 링크

### 2026-05-21 Google OAuth + 개인 설정 + 채용/알림/감사로그 강화
- `459332d` 채용 상태 필터·칸반 / `18d4bed` /notifications 페이지
- `444d691` 감사 로그 필터·검색 / `71cf489` 구성원 CSV 가져오기
- `0a1fc6b` 팀 휴가 캘린더 / `3407158` Google OAuth / `52638ab` 개인 설정

### 그 이전
- 양식 빌더, ⌘K 커맨드 팔레트, 회사 설정, 휴가 정책, 구성원 상세 탭, 홈 대시보드
- P8 알림, P7 보안, P6 문서, P5 채용, P4 워크플로우, P3 휴가, P2 Core HR, P1 권한

## 알려진 미완/잔여

- **2FA / IP 제한** — 정책 저장·UI는 되나 로그인 강제 적용 미구현 (UI에 "준비 중" 표기됨)
- **연차 소멸·이월·격년 가산** — 자동부여(MVP)는 동작, 소멸(expiryMonths)·이월(carryoverMaxDays)·격년 가산·회계연도 모드는 미구현
- **인사 발령** — 신규 입사 시 HIRE 발령 자동 시드 미적용 (첫 발령 등록 전까지 발령 탭 비어 있음). 런타임 동작 미검증
- **휴가 ↔ 워크플로우 분리** — docs "통합 결재 인프라" 원칙 미적용
- Worker(BullMQ) 빈 skeleton — 비동기 처리 미구현
- 파일 업로드(S3)·이메일 발송 미연동 — `fileUrl` 수동 입력, 초대 링크 메일 미발송
- 채용 depth — 지원서 양식/이력서 첨부/면접 일정/스코어카드 미구현

## 알려진 이슈 / 메모

- **UI 디자인 폴리시**: 기능 검증 완료 후 Flex 스타일로 디자인 다듬기 (기능 구현 우선)
- **Docker Desktop 미설치/미시작 시**: 마이그레이션·DB 작업 전부 막힘. WSL2 활성화 필요.
- **플랫폼 관리자**: `SYSTEM_ADMIN_EMAILS` 환경변수에 이메일 등록 → 해당 계정으로 `/admin` 접근
- **Google OAuth**: `.env`에 키 설정됨. Google Cloud Console 리디렉션 URI 등록 필요 (`http://localhost:3000/api/auth/callback/google`)
- 빌드는 **Turbopack 전용** (webpack prod 빌드는 Docker Desktop 소켓 EACCES 이슈)
- **`next build` standalone 패키징 실패** — `output: "standalone"` 의 node_modules 심볼릭 링크가 Windows 권한으로 막힘. 코드 컴파일·정적 생성은 정상, dev 는 무관. 배포 패키징 시 Windows Developer Mode 활성화 필요
- 워크스페이스 상대 import는 **확장자 없이** (`.js` 금지)
- 권한 키 컨벤션: `<category>.<domain>.<action>` (예: `member.directory.read`)
- `UserRole`은 `employeeId` 기준 (User가 아님 — 회사별 신분)
- **Windows 터미널**: PowerShell 또는 `chcp 65001` 후 cmd 사용 권장 (CP949 한글/이모지 잘림 이슈)
- **데모 모드**: `TEAMLET_DEMO_AUTO_APPROVE=true` 운영 환경에 절대 켜지 말 것 (운영 시 `/admin`에서 수동 검토)
- **prisma migrate dev**: 비대화형 환경에서 막힘 → `db push`로 대체 후 마이그레이션 파일 수동 관리

## 자주 쓰는 명령

```powershell
pnpm docker:up           # Postgres + Redis + MinIO
pnpm db:generate         # schema 변경 후 (DB 연결 불필요)
pnpm db:migrate          # 마이그레이션 적용 (DB 필요)
pnpm db:seed             # 권한 카탈로그 시드
pnpm dev                 # web + worker (http://localhost:3000)
pnpm docker:down         # 컨테이너 종료
pnpm --filter web typecheck        # 웹 앱 타입 체크
pnpm --filter @teamlet/modules typecheck   # 모듈 타입 체크
```
