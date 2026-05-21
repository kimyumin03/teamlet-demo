# 진행 상황

> 세션 시작 시 이 파일을 먼저 읽고, 작업이 끝나면 **다음에 할 일** 섹션을 업데이트하세요.
> 상세 스펙은 `CLAUDE.md` + `/docs` 참조.

## 전체 진행도 (2026-05-21 기준)

| 영역 | 상태 | 비고 |
|---|---|---|
| 명세서 `/docs` | ✅ 100% | 00~06 7종, 6,050 lines |
| DB 스키마 + 시드 | ✅ P1~P5 + 확장 | 마이그레이션 11개 (`0_init` ~ `11_leave_policy`) |
| Shared 패키지 | ✅ 스키마 확장 중 | schemas: 사원/정책/휴가/양식/회사/공휴일 |
| UI 시스템 | 🟡 기초만 | theme + primitives 3 / patterns 3 |
| **P1 인증/가입** | ✅ 완료 | auth 모듈 + 화면 5개 + NextAuth + 데모 자가-승인 |
| **P1 권한** | ✅ 핵심 완료 | 평가/CRUD/매핑/UserRole/락아웃/부트스트랩 ✓ |
| **P2 Core HR (구성원/조직/직책)** | ✅ 완료 | 탭 상세 + 확장 필드 (gender/phone/birthDate/employmentType 등) |
| **P3 휴가** | ✅ UI 완료 | /leave + 신청/취소 + 관리자 승인/반려 + 수동 부여 ✓ |
| **P3 휴가 정책** | ✅ 완료 | LeavePolicy DB + CRUD + 배정 UI (`/settings/leave-policies`) |
| **P4 워크플로우** | ✅ MVP 완료 | /workflow + 문서 상세 + 승인/반려 ✓ |
| **P4 양식 빌더** | ✅ 완료 | FormTemplate CRUD + 필드 편집 UI (`/settings/form-templates`) |
| **P5 채용** | ✅ MVP 완료 | /recruit 공고 목록 + /recruit/postings/[id] 후보자 관리 ✓ |
| **P6 문서·증명서** | ✅ MVP 완료 | /documents 보관소 + /documents/certificates 발급/인쇄 ✓ |
| **P7 보안** | ✅ MVP 완료 | /settings/security 보안 정책 + /audit-log 감사 로그 뷰어 ✓ |
| **P8 알림** | ✅ MVP 완료 | Notification DB + 알림 벨 패널 + 휴가/워크플로우 이벤트 연동 ✓ |
| **회사 설정** | ✅ 완료 | 회사 정보 수정 + 공휴일 관리 (`/settings/company`, `/settings/holidays`) |
| **⌘K 커맨드 팔레트** | ✅ 완료 | 구성원 검색 + 전체 페이지 네비게이션 |
| Worker | ⬜ 빈 skeleton | BullMQ 미구현 |

## 현재 위치

- **Phase**: P1~P8 + 설정/UX 확장 완료
- **브랜치**: `main`
- **원격**: `https://github.com/kimyumin03/Teamlet.git`
- **마지막 커밋**: `891fd18 feat: 양식 빌더`
- **마이그레이션**: 11개 모두 적용됨 (`0_init` ~ `11_leave_policy`)

## 다음 작업 후보 (우선순위 순)

### 🔴 HIGH — 실사용 갭
1. **대시보드 홈 피드** — 현재 링크 목록뿐. 결재 대기 카드 + 내 휴가 잔여 + 최근 알림. Flex 첫 화면과 가장 큰 차이.
2. **워크플로우 문서 생성 개선** — 양식 선택 → 동적 필드 입력 → 결재선 지정 (현재 결재선 하드코딩)
3. **구성원 목록 필터/탭** — 재직상태별 탭 (재직/수습/휴직/퇴직), 고용형태 필터

### 🟡 MEDIUM — Flex 대비 격차
4. **개인 설정** — 비밀번호 변경, 프로필 수정 (`/settings/profile`)
5. **팀 휴가 캘린더** — 월별 뷰, 공휴일 + 승인된 휴가 표시
6. **CSV 일괄 가져오기** — 구성원 대량 등록 (Flex 핵심 기능)
7. **회사 가입 초대 UI** — 초대 링크 발송/관리 화면

### 🟢 LOW — 선택적 강화
8. Worker(BullMQ) — 휴가 부여 자동화, 비동기 알림
9. 실시간 알림 (SSE)
10. Position.isOrgHead 권한 평가 통합
11. 2FA 실제 TOTP 연동

## 최근 한 일

### 갭 분석 → 우선순위 5개 (2026-05-21 이번 세션)
- `891fd18` 양식 빌더 — FormTemplate CRUD + 필드 편집 UI (text/textarea/number/date/select/checkbox)
- `68d392e` ⌘K 커맨드 팔레트 — cmdk + 구성원 검색 + 전체 네비게이션
- `0be3034` 회사 설정 — 회사정보 수정 + 공휴일 관리
- `9bc7bf0` 휴가 정책 엔진 — LeavePolicy DB(migration 11) + CRUD + 배정 UI
- `f578b57` 구성원 상세 탭 — Employee 필드 확장 (gender/phone/birthDate/employmentType/probationEndDate)

### P8 알림 (2026-05-21 이전 세션)
- `f47f9e9` P8 — Notification DB + notification 모듈 + 알림 벨 패널 + 휴가/워크플로우 이벤트 연동

### P7 보안 (2026-05-21)
- `eed7cdb` P7 — CompanySecurityPolicy DB + security 모듈 + /settings/security + /audit-log

### P6 문서·증명서 (2026-05-21)
- `11b1edc` P6 — DB(CompanyDocument/CertificateIssue) + document 모듈 + /documents + /documents/certificates

### P5 채용 (2026-05-21)
- `481c37d` P5 — DB(JobPosting/JobStage/Candidate) + recruit 모듈 + /recruit + /recruit/postings/[id]

### P4 워크플로우 (2026-05-21)
- `d9686f7` P4 4단계 — 문서 상세 페이지 (/workflow/documents/[id])
- `8eb358f` P4 마이그레이션 — 5_workflow_core
- `7866497` P4 2~3단계 — 워크플로우 모듈 + /workflow UI
- `e7b2703` P4 1단계 — DB 스키마 (FormTemplate/Document/ApprovalLine/Action)

### P3 휴가 UI (2026-05-21)
- `3d51dd5` P3 4단계 — 수동 부여 Dialog (GrantLeaveButton)
- `d6f8758` P3 3단계 — 관리자 승인/반려 뷰 (/leave/requests)
- `770b293` P3 2단계 — /leave 페이지 + 신청 Dialog + 취소 버튼

### P3 휴가 도메인 (2026-05-20)
- `90730fe` P3 1단계 — CompanyHoliday·LeaveTransaction 스키마 + leave 모듈 + Server Actions

### P2 Core HR (이전 세션)
- P2 1~7단계 — 구성원 디렉토리/검색/부서/상세/수정/퇴직/직책

### P1 권한 + 자가-승인 (직전 세션)
- P1 권한 CRUD + 락아웃 가드 + 부트스트랩 + 데모 자가-승인

## 알려진 미완/잔여

- Worker(BullMQ) 빈 skeleton — 비동기 처리 미구현
- 워크플로우 결재선 하드코딩 — 양식 선택 + 동적 결재선 지정 필요
- `Position.isOrgHead` — DB 데이터만, 권한 평가 미통합
- 권한 편집 UI — Checkbox/Tabs primitive 미구현으로 단순 select로만 동작

## 알려진 이슈 / 메모

- **UI 디자인 폴리시**: 기능 검증 완료 후 Flex 스타일로 디자인 다듬기 (기능 구현 우선)
- **Docker Desktop 미설치/미시작 시**: 마이그레이션·DB 작업 전부 막힘. WSL2 활성화 필요.
- **`.env` 파일 부재**: 루트에 `.env.example`만 있음. AUTH_SECRET + TEAMLET_DEMO_AUTO_APPROVE 설정 필요.
- 빌드는 **Turbopack 전용** (webpack prod 빌드는 Docker Desktop 소켓 EACCES 이슈)
- 워크스페이스 상대 import는 **확장자 없이** (`.js` 금지)
- 권한 키 컨벤션: `<category>.<domain>.<action>` (예: `member.directory.read`)
- `UserRole`은 `employeeId` 기준 (User가 아님 — 회사별 신분)
- **Windows 터미널**: PowerShell 또는 `chcp 65001` 후 cmd 사용 권장 (CP949 한글/이모지 잘림 이슈)
- **데모 모드**: `TEAMLET_DEMO_AUTO_APPROVE=true` 운영 환경에 절대 켜지 말 것

## 자주 쓰는 명령

```powershell
pnpm docker:up           # Postgres + Redis + MinIO
pnpm db:generate         # schema 변경 후 (DB 연결 불필요)
pnpm db:migrate          # 마이그레이션 적용 (DB 필요)
pnpm db:seed             # 권한 카탈로그 시드
pnpm dev                 # web + worker (http://localhost:3000)
pnpm docker:down         # 컨테이너 종료
```
