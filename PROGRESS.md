# 진행 상황

> 세션 시작 시 이 파일을 먼저 읽고, 작업이 끝나면 **다음에 할 일** 섹션을 업데이트하세요.
> 상세 스펙은 `CLAUDE.md` + `/docs` 참조.

## 전체 진행도 (2026-05-21 기준)

| 영역 | 상태 | 비고 |
|---|---|---|
| 명세서 `/docs` | ✅ 100% | 00~06 7종, 6,050 lines |
| DB 스키마 + 시드 | ✅ P1~P5 + 확장 | 마이그레이션 12개 (`0_init` ~ `12_google_oauth`) |
| Shared 패키지 | ✅ 스키마 확장 중 | schemas: 사원/정책/휴가/양식/회사/공휴일/프로필/비밀번호 |
| UI 시스템 | 🟡 기초만 | theme + primitives 3 / patterns 3 |
| **P1 인증/가입** | ✅ 완료 + 강화 | auth 모듈 + 화면 5개 + NextAuth + 데모 자가-승인 + Google OAuth + 초대 링크 + 로그인 IP/UA 기록 |
| **P1 권한** | ✅ 완료 | 평가/CRUD/UserRole/락아웃/부트스트랩 + isOrgHead 동적역할 + 권한 운영 UI(배정·매트릭스) ✓ |
| **P2 Core HR (구성원/조직/직책)** | ✅ 완료 | 탭 상세 + 확장 필드 + 상태 탭 필터 + 고용형태 필터 + CSV 일괄 등록 + 휴가·결재 탭 |
| **P3 휴가** | ✅ UI 완료 | /leave + 신청/취소 + 관리자 승인/반려 + 수동 부여 + 팀 캘린더 ✓ |
| **P3 휴가 정책** | 🟡 저장만 | LeavePolicy DB + CRUD + 배정 UI ✓ / 자동 부여·소멸 엔진 미구현 |
| **P4 워크플로우** | ✅ MVP 완료 | /workflow + 3단계 위저드 + 순차 결재 강제 ✓ |
| **P4 양식 빌더** | ✅ 완료 | FormTemplate CRUD + 필드 편집 UI (`/settings/form-templates`) |
| **P5 채용** | ✅ 강화 완료 | 공고 목록 + 상태 필터 + 후보자 목록/칸반/상세 + 메모 ✓ |
| **구성원 CSV** | ✅ 완료 | 가져오기 + 내보내기 (`/api/members/export`) |
| **P6 문서·증명서** | ✅ MVP 완료 | /documents 보관소 + /documents/certificates 발급/인쇄 ✓ |
| **P7 보안** | 🟡 부분 | 보안 정책 CRUD + 감사 로그 ✓ / 2FA·IP 제한은 정책 저장만(강제 미적용) |
| **P8 알림** | ✅ 강화 완료 | 알림 벨 패널 + /notifications 전용 페이지 (탭/읽음 처리) ✓ |
| **회사 설정** | ✅ 완료 | 회사 정보 수정 + 공휴일 관리 |
| **개인 설정** | ✅ 완료 | /settings/profile — 프로필 수정 + 비밀번호 변경 |
| **⌘K 커맨드 팔레트** | ✅ 완료 | 구성원 검색 + 전체 페이지 네비게이션 |
| **홈 대시보드** | ✅ 완료 | 결재 대기 + 연차 잔여 + 최근 문서 + 알림 + 빠른 이동 |
| 도메인 권한 가드 | ✅ 완료 | 휴가/채용/증명서/문서/설정 모듈 assertPermission 적용 |
| **플랫폼 운영 콘솔** | ✅ 완료 | `/admin` — 회사 신청 승인/반려 + 회사 목록 + 통계 |
| Worker | ⬜ 빈 skeleton | BullMQ 미구현 |

## 현재 위치

- **Phase**: P1~P8 + 설정/UX + 보안 가드/권한 운영 UI/플랫폼 콘솔 완료
- **브랜치**: `main`
- **원격**: `https://github.com/kimyumin03/Teamlet.git`
- **마지막 커밋**: `d327ee4 fix(security): 착시 제거 — 로그인 IP/UA 실기록 + 미적용 정책 "준비 중" 표기`
- **마이그레이션**: 12개 적용 (`0_init` ~ `12_google_oauth`, db push로 적용)

## 다음 작업 후보 (Flex 비교 검토 2026-05-21 반영)

### ✅ 완료
- 도메인 권한 가드 일괄 추가 — 휴가/채용/증명서/문서/설정 `assertPermission`
- 워크플로우 순차 결재 버그 — step 건너뛰기 차단
- 권한 운영 UI — 역할 배정(구성원 상세) + 권한 매트릭스(`/settings/permissions/[roleId]`)
- 플랫폼 운영 콘솔 — `/admin` 회사 신청 승인/반려
- 착시 제거 — 로그인 IP/UA 실기록 + 2FA·IP·연차 정책 "준비 중" 표기

### 🟡 다음
1. **Depth 보강** — 인사 발령(Appointment/PositionHistory), 휴가-워크플로우 통합, 연차 자동부여 엔진
2. **2FA / IP 제한 실적용** — TOTP(otplib·UserMFA 모델) / IP 화이트리스트 강제 (락아웃 안전장치 포함)
3. **Worker(BullMQ)** — 휴가 자동 부여·소멸, 비동기 알림 / **실시간 알림** — SSE

### 🟢 LOW — 선택적 강화
- 채용 depth (지원서 양식·이력서 첨부·면접 일정·스코어카드)
- 파일 업로드(S3)·이메일 발송 실연동
- 모바일 반응형 (웹 우선이라 후순위)

## 최근 한 일

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
- **연차 자동 부여/소멸 엔진** — LeavePolicy 저장만, 실행 로직 없음 (수동 부여만 동작, UI 표기됨)
- **인사 발령(Appointment/PositionHistory)** — 미구현, `updateEmployee` 컬럼 덮어쓰기로 이력 소실
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
