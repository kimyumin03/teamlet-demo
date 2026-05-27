# 진행 상황

> 세션 시작 시 이 파일을 먼저 읽고, 작업이 끝나면 **다음에 할 일** 섹션을 업데이트하세요.
> 상세 스펙은 `CLAUDE.md` + `/docs` 참조.

## 전체 진행도 (2026-05-26 세션5 기준)

| 영역 | 상태 | 비고 |
|---|---|---|
| 명세서 `/docs` | ✅ 100% | 00~06 7종, 6,050 lines |
| DB 스키마 + 시드 | ✅ P1~P5 + 확장 | 마이그레이션 12개 (`0_init` ~ `12_google_oauth`) + announcements/cc 테이블 (db push) |
| Shared 패키지 | ✅ 스키마 확장 중 | schemas: 사원/정책/휴가/양식/회사/공휴일/프로필/비밀번호 |
| UI 시스템 | 🟡 기초만 | theme + primitives 3 / patterns 3 |
| **P1 인증/가입** | ✅ 완료 + 강화 | 이메일 전용 로그인 + 플랫폼 관리자 2단계 비밀키 + 회원가입 이름/이메일/연락처만 + 회사 문서 업로드 |
| **P1 권한** | ✅ 완료 | 평가/CRUD/UserRole/락아웃/부트스트랩 + isOrgHead 동적역할 + 권한 운영 UI(배정·매트릭스) ✓ |
| **P2 Core HR (구성원/조직/직책)** | ✅ 완료 | 탭 상세 + 확장 필드 + 상태/고용형태 필터 + CSV 일괄 등록 + 휴가·결재 탭 + **인사 발령 이력 탭** |
| **P3 휴가** | ✅ UX 고도화 완료 | /leave 탭 구조(대시보드/신청내역) + 진행 바 잔여 카드 + 상태 필터 + 팀 캘린더 ✓ |
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
| **홈 대시보드** | ✅ 고도화 완료 | 3탭(홈피드/회사소식/할일) + 미니 캘린더 사이드바 + 스탯카드 + 빠른 이동 |
| 도메인 권한 가드 | ✅ 완료 | 휴가/채용/증명서/문서/설정 모듈 assertPermission 적용 |
| **플랫폼 운영 콘솔** | ✅ 강화 완료 | `/admin` — 전용 콘솔 UI(dark sidebar) + 사용자 관리 + 회사 신청/목록/통계 |
| **설정 레이아웃** | ✅ 고도화 완료 | (settings) 독립 라우트 그룹 + UX 고도화(홈 아이콘 브레드크럼·아바타·구분선·sticky 사이드) |
| **HR 휴가 관리** | 🟡 구현됨 | `/hr/leave` — 보유현황 + 사용내역 + 맞춤 부여 + **연차 소멸·이월 버튼** ⚠️ 런타임 미검증 |
| **연차 소멸·이월** | 🟡 구현됨 | `processLeaveExpiry` + `ExpiryButton` — 정책 기반 소멸·이월 (멱등) ⚠️ 런타임 미검증 |
| **실시간 알림(SSE)** | ✅ 완료 | `/api/notifications/stream` — 15초 폴링 SSE + `NotificationBell` liveCount 구독 |
| **공지사항 수정/삭제** | ✅ 완료 | `AnnouncementActions` 드롭다운 (수정 다이얼로그·삭제·고정 토글), 작성자만 노출 |
| **결재 정책 관리** | ✅ 완료 | `ApprovalPolicy` 스키마 + 모듈 + `/settings/approval-policies` + db:push 완료 |
| **조직도 시각화** | ✅ 완료 | `/members/org-chart` RSC + `OrgTree` 클라이언트 컴포넌트 (트리 빌드 + 연결선) |
| Worker | ⬜ 빈 skeleton | BullMQ 미구현 |

## 현재 위치

- **Phase**: P1~P8 + UX 고도화(구성원/어드민) + Flex 레퍼런스 기반 리디자인 진행 중
- **브랜치**: `main`
- **원격**: `https://github.com/kimyumin03/Teamlet.git`
- **마지막 커밋**: `37e1a1f docs: 2026-05-22 세션2 진행 내역 정리` (오늘 작업은 미커밋)
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
1. ~~**홈 대시보드**~~ ✅ 완료 — 3탭(홈피드/회사소식/할일) + 미니 캘린더 + 스탯카드
2. ~~**휴가 도메인**~~ ✅ 완료 — 탭 구조 + 진행 바 카드 + 상태 필터
3. ~~**전자결재 참조함**~~ ✅ 완료 — DocumentCcRecipient 스키마 + 모듈 + 탭 UI + 기안 위저드 CC 선택
4. ~~**공지사항 수정/삭제 UI**~~ ✅ 완료 — AnnouncementActions 드롭다운 (수정·삭제·고정 토글)
5. ~~**실시간 알림(SSE)**~~ ✅ 완료 — /api/notifications/stream + NotificationBell liveCount
6. ~~**연차 소멸·이월**~~ ✅ 완료 — processLeaveExpiry + ExpiryButton (/hr/leave 헤더)
7. ~~**결재 정책 관리**~~ ✅ 완료 — ApprovalPolicy 스키마 + 모듈 + /settings/approval-policies
8. ~~**설정 도메인 레이아웃 통일**~~ ✅ 완료 — settings/layout.tsx + settings-nav.tsx + 8페이지 헤더 표준화
9. ~~**HR 휴가 관리**~~ ✅ 구현됨 — /hr/leave 보유현황·사용내역·맞춤부여 (런타임 미검증)
10. ~~**조직도 시각화**~~ ✅ 완료 — `/members/org-chart` RSC + OrgTree 클라이언트 컴포넌트
11. ~~**휴가 종류 관리 UI**~~ ✅ 완료 — `/settings/leave-types` + CRUD 모듈
12. ~~**구성원 탭 확장**~~ ✅ 완료 — 경력/학력/가족 탭 + DB 스키마 + CRUD 모듈
13. **IP 제한 실적용** — IP 화이트리스트 강제
14. **Worker(BullMQ)** — 휴가 자동 부여·소멸, 비동기 알림

### 🟢 LOW — 선택적 강화
- 채용 depth (지원서 양식·이력서 첨부·면접 일정·스코어카드)
- 파일 업로드(S3)·이메일 발송 실연동
- 모바일 반응형 (웹 우선이라 후순위)

## 최근 한 일

### 2026-05-26 세션5 — 인증 간소화 + 회사 문서 업로드 + 플랫폼 관리자 2단계 인증

**인증 전면 간소화 (이메일 전용)**
- 회원가입: 이름 + 이메일 + 연락처만 입력. 내부 임시 비밀번호 자동 생성(`generateTempPassword`) → 즉시 자동 로그인 (`signIn("credentials", { email })`)
- 로그인: 이메일 한 개 필드만 노출. 비밀번호·2FA 코드 필드 제거
- `signupSchema`, `SignupInput` — password/passwordConfirm 제거
- `createUserAccount` — 임시 비밀번호 내부 생성 후 저장, `tempPassword` 반환
- `findUserByEmail(email)` 신규 함수 — 이메일로 사용자 조회 후 로그인 허용
- `auth.ts` credentials authorize — password 없이 `findUserByEmail` 호출

**플랫폼 관리자 2단계 비밀키 인증**
- 일반 로그인 폼에서 플랫폼 관리자 이메일 입력 시 `/admin-key?email=...` 페이지로 분기
- `/admin-key` 페이지 신규: 이메일(읽기 전용) + 관리자 비밀키 입력 → 인증
- `adminKeyLoginAction`: 비밀키가 `PLATFORM_ADMIN_SECRET` 환경변수와 일치해야 `/admin` 접근
- `authorize` 함수: 플랫폼 관리자 이메일이면 `adminKey` 필수 검증
- `.env.local`에 `PLATFORM_ADMIN_SECRET="teamlet-admin-2024"` 추가

**회사 등록 신청 문서 업로드**
- `CompanyApplication` 스키마에 `documentUrl String?` 추가 → `db:push` 완료
- 업로드 파일 `public/uploads/applications/` 로컬 저장 (PDF/JPG/PNG/WEBP, 10MB 제한)
- `RegisterCompanyForm` — 파일 선택 커스텀 UI (파일명 표시, 선택 시 primary 테두리)
- `companyApplicationAction` — File 검증 + 저장 + `documentUrl` DB 저장
- 플랫폼 관리자 콘솔(`ApplicationsClient`) — "사업자 증빙 서류 보기" 링크 표시

**회사 가입 흐름 UX**
- 회사 가입 메뉴 화면: 뒤로가기 버튼 추가 (`window.history.back()`)
- 회사코드 입력 화면: "← 다른 방법 선택" + "뒤로가기" 병렬 배치

**DB 초기화 + 재시드**
- `prisma db push --force-reset` → 전체 데이터 삭제 + 재생성
- `pnpm db:seed` 재실행 — 권한 51개 + 데모 계정 4개
- 데모 회사코드 `DEMO0001` → `DEMO-0001` (XXXX-XXXX 형식 준수)

### 2026-05-26 세션4 — 플랫폼 어드민 가드 + 회사 등록 폼 + 설정 레이아웃 UX 고도화

**플랫폼 어드민 리디렉션 & 접근 제한**
- `loginAction`: `isPlatformAdminEmail` 체크 → `/admin` 리디렉션 (credentials 로그인)
- `LoginPage`: 이미 로그인 시 어드민 계정이면 `/admin`으로 즉시 리디렉션
- `(app)/layout.tsx`: 어드민 계정이 일반 앱 라우트 접근 시 `/admin`으로 강제 리디렉션
- `(settings)/layout.tsx`: 동일 가드 적용

**회사 등록 폼 개선**
- `useActionState` → `useState + useTransition` 전환 — 오류 시 입력값 보존
- 사업자등록번호 자동 포맷: `000-00-00000` (10자리 고정)
- 연락처 자동 포맷: 서울 `02-` (2자리) + 전국 010/031 등 (3자리) 전 형식 지원
- 필드별 에러 (`FieldErrors`) + 필드 테두리 색상 강조 (`border-destructive-500`)
- 입력 시 해당 필드 에러 즉시 해제

**설정 라우트 그룹 분리**
- `app/(app)/settings/*` → `app/(settings)/settings/*` 이동
- `(settings)/layout.tsx`: 독립 레이아웃 (앱 사이드바 없음)
- 중복 inner 레이아웃 제거

**설정 레이아웃 UX 고도화**
- 헤더 h-14, max-w-5xl 정렬, 홈 아이콘(SVG) + 꺾쇠 브레드크럼
- 사용자 아바타 circle (이니셜 2자) + 이름 + 수직 구분선 + 로그아웃 버튼
- 사이드바 `sticky top-[72px]` + "설정" 타이틀 텍스트 추가 + w-48
- 사이드바↔콘텐츠 사이 수직 구분선 (`w-px bg-border`)
- 콘텐츠 영역 `pb-16` 하단 여백

### 2026-05-26 세션3 — Phase A 완료 + Phase B 조직도 시각화

**Phase A — 완료 항목**
- 공지사항 수정/삭제 UI (`AnnouncementActions` 드롭다운, 작성자만 노출)
- 연차 소멸·이월 처리 (`processLeaveExpiry` 멱등 엔진 + `ExpiryButton`)
- 실시간 알림 SSE (`/api/notifications/stream` 15초 폴링 + `NotificationBell` liveCount)
- 결재 정책 관리 (`ApprovalPolicy` 스키마 + 모듈 + `/settings/approval-policies` UI) — db:push 완료
- 승인 플로우 수정: 이메일 미발송, `/pending-approval` → 로그인 시 바로 `/home`

**휴가 종류 관리 UI (`/settings/leave-types`)**
- `packages/modules/src/leave/leave-type.ts` (NEW): `LeaveTypeFullItem` 타입 + `listLeaveTypesFull` / `createLeaveType` / `updateLeaveType` / `deleteLeaveType`
  - 시스템(법정) 타입 삭제 차단, 잔여·정책 연결 시 삭제 차단
  - key 유효성(소문자·숫자·밑줄), 중복 방지, sortOrder 자동 배정
- `packages/modules/src/leave/index.ts`: 신규 함수·타입 export 추가
- `apps/web/src/lib/actions/leave-type.ts` (NEW): `createLeaveTypeAction`, `updateLeaveTypeAction`, `deleteLeaveTypeAction`
- `components/settings/settings-nav.tsx`: "휴가 종류" 항목 추가 (운영 그룹)
- `settings/leave-types/page.tsx` (NEW): RSC, `listLeaveTypesFull` fetch, 권한 가드
- `settings/leave-types/_components/leave-types-client.tsx` (NEW): 테이블 목록 + 추가/수정 다이얼로그
  - 법정 타입: 자물쇠 아이콘, 삭제 비활성, key 읽기전용
  - 활성/비활성 인라인 토글, 급여 타입 색상 배지
- 타입 체크 통과 ⚠️ 런타임 미검증

**구성원 탭 확장 (경력/학력/가족)**
- DB: `CareerHistory`, `EducationHistory`, `FamilyMember` 모델 추가 + `EducationDegree` enum + Employee 역관계 — `db:push` 완료
- `packages/modules/src/employee/career.ts` (NEW): 경력·학력·가족 CRUD 함수 9개 + 타입 정의
  - 권한: read=`member.directory.read`, write=`member.directory.manage`
- `packages/modules/src/employee/index.ts`: 신규 함수·타입 export
- `apps/web/src/lib/actions/employee-profile.ts` (NEW): Server Actions 9개 (create/update/delete × 3종)
- `members/[id]/_components/career-tab.tsx` (NEW): 경력 탭 클라이언트 컴포넌트 (입사년월 type=month, 재직중 체크박스)
- `members/[id]/_components/education-tab.tsx` (NEW): 학력 탭 (학위/전공/재학중 체크박스)
- `members/[id]/_components/family-tab.tsx` (NEW): 가족 탭 (관계 datalist 자동완성, 피부양자 체크박스)
- `members/[id]/page.tsx`: TABS 8개로 확장, 3개 fetch 추가, 탭 콘텐츠 렌더링
- 타입 체크 통과 ⚠️ 런타임 미검증

**Phase B — 조직도 시각화**
- `apps/web/src/app/(app)/members/org-chart/page.tsx` (NEW): RSC, `listDepartments` + `listEmployees` 병렬 fetch, 권한 가드, 빈 상태 처리
- `apps/web/src/app/(app)/members/org-chart/_components/org-tree.tsx` (NEW): 클라이언트 컴포넌트
  - `buildTree()`: flat `DepartmentNode[]` → `TreeNode[]` (parentId 조립, sortOrder 정렬)
  - `DeptCard`: 부서 카드 (이름 + 구성원 수 + 아바타 칩 최대 5명 + +N 더)
  - `OrgNode`: 재귀 렌더, 수직 trunk + 형제 연결 수평 branch (절대 위치 h-px 분기선)
  - 미배정 구성원 섹션 (구분선 아래)
- `apps/web/src/app/(app)/members/page.tsx`: 뷰 탭 추가 ("구성원 목록" ↔ "조직도" 탭 row)
- 타입 체크 통과 (`roots[0]` undefined 가드)

### 2026-05-26 세션2 — 설정 레이아웃 통일 + 핵심 버그 수정 + HR 휴가 관리

**설정 도메인 레이아웃 통일**
- `apps/web/src/components/settings/settings-nav.tsx` (NEW): "use client", 3개 그룹(개인/회사/운영), `usePathname` 활성 상태
- `apps/web/src/app/(app)/settings/layout.tsx` (NEW): `max-w-5xl` 외부 컨테이너 + `w-44` 사이드바 + `flex-1` 콘텐츠 영역
- 8개 설정 페이지 헤더 표준화 (`text-xl font-semibold mb-6`): profile, company, security, holidays, form-templates, leave-policies, permissions, permissions/[roleId]

**핵심 버그 3개 수정**
- Bug 1 (`leave/request.ts`): 이중 차감 버그 — PENDING 상태 휴가도 잔여일 계산에 포함 (`pendingDays` 집계 추가)
- Bug 2 (`leave/request.ts`): `cancelLeave` 시 FormDocument·ApprovalLine 고아 레코드 — 취소 트랜잭션에 `status: "CANCELLED"` / `status: "REJECTED"` 업데이트 추가
- Bug 3 (`workflow/approval.ts`): 이미 종료된 문서(CANCELLED/REJECTED) 재결재 가능 — `approveDocument`/`rejectDocument` 진입 시 상태 가드 추가

**HR 휴가 관리 신규 구현 (`/hr/leave`)**
- `packages/modules/src/leave/types.ts`: `CompanyLeaveBalanceRow`, `CompanyLeaveRequestItem` 타입 추가
- `packages/modules/src/leave/balance.ts`: `listCompanyLeaveBalances(actorEmployeeId, year)` — 전 활성 구성원 × 전 활성 휴가 유형, `leave.balance.manage` 권한 가드
- `packages/modules/src/leave/request.ts`: `listCompanyLeaveRequests(actorEmployeeId)` — 전사 신청 내역, 500행 제한
- `apps/web/src/app/(app)/hr/leave/_components/balance-table.tsx` (NEW): RSC, 가로 스크롤 테이블, 동적 열(부여/사용/잔여), 잔여 색상 경고(amber ≤3일, red ≤0)
- `apps/web/src/app/(app)/hr/leave/_components/requests-table.tsx` (NEW): 클라이언트, 필터 탭(전체/대기/승인/반려/취소) + 카운트 배지
- `apps/web/src/components/hr/grant-leave-button.tsx` (NEW): 맞춤 부여 다이얼로그 (구성원·종류·일수·사유, 0.5일 단위)
- `apps/web/src/app/(app)/hr/leave/page.tsx` (NEW): RSC, `?tab=balances|requests`, 연도 내비게이션(‹/›), 4개 데이터 소스 병렬 fetch
- `apps/web/src/components/layout/app-sidebar.tsx`: "휴가 관리" 메뉴 항목 추가 (`/hr/leave`)
- ⚠️ 타입체크 통과. 런타임 미검증.

### 2026-05-26 — 공지사항(Announcement) 모듈 전체 구현

**DB 스키마**
- `Announcement` 모델 추가 (`announcements` 테이블) — `@@index([companyId, isPinned, createdAt(sort: Desc)])`
- `Company.announcements`, `Employee.authoredAnnouncements` 역관계 추가
- `pnpm db:generate` 완료 / `db:push`는 Docker 재기동 후 적용 필요 ⚠️

**모듈 (`packages/modules/src/announcement`)**
- `types.ts`: `AnnouncementItem`, `CreateAnnouncementInput`, `UpdateAnnouncementInput`
- `announcement.ts`: `listAnnouncements`, `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`, `togglePin`
- `index.ts`: 모듈 export
- `packages/modules/package.json`: `./announcement` 서브패스 export 추가
- `packages/modules/src/index.ts`: `export * as announcement` 추가

**Server Actions**
- `apps/web/src/lib/actions/announcement.ts`: `createAnnouncementAction`, `updateAnnouncementAction`, `deleteAnnouncementAction`, `togglePinAction` (모두 `revalidatePath("/home")`)

**UI**
- `components/announcement/create-announcement-button.tsx`: 공지 작성 다이얼로그 (제목/내용/상단고정 체크)
- `home/_components/news-tab.tsx`: 실 데이터 연동 — 공지 목록 + 작성 버튼 + 핀 아이콘 + 날짜/작성자
- `home/page.tsx`: `listAnnouncements(employeeId)` 병렬 fetch + `announcements` prop 전달
- ⚠️ 타입체크 통과. DB push 후 런타임 검증 필요.

### 2026-05-26 — 전자결재 참조함(CC) 전체 구현

**DB 스키마**
- `DocumentCcRecipient` 모델 추가 (`document_cc_recipients` 테이블) — `@@unique([documentId, employeeId])`
- `FormDocument.ccRecipients`, `Employee.ccDocuments` 역관계 추가
- `pnpm db:generate` 완료 / `db:push`는 Docker 재기동 후 적용 필요 ⚠️

**모듈 (`packages/modules/src/workflow`)**
- `types.ts`: `CreateDocumentInput.ccRecipientIds?` 추가, `CcDocumentItem` 타입 신규
- `types.ts`: `DocumentDetail.ccRecipients` 필드 추가
- `document.ts`: `getDocument` — CC 참조자도 열람 허용 (`isRelated` 체크 확장)
- `document.ts`: `createDocument` — CC 생성 트랜잭션 포함
- `document.ts`: `listCcDocuments(employeeId)` 신규 함수
- `index.ts`: `listCcDocuments`, `CcDocumentItem` export 추가

**Server Action**
- `lib/actions/workflow.ts`: `createDocumentAction` — `ccRecipientIds` 파라미터 전달

**UI**
- `CreateDocumentButton` Step 3: 참조자 선택 UI 추가 (최대 5명, 선택 선택)
- `workflow/page.tsx`: 참조함 탭 추가 (받은결재함/보낸결재함/**참조함**/임시저장/전체)
- `workflow/page.tsx`: `CcDocList` 컴포넌트 — 참조 문서 목록
- `workflow/documents/[id]/page.tsx`: 결재선 사이드바에 참조자 태그 표시
- ⚠️ 타입체크 통과. DB push 후 런타임 검증 필요.

### 2026-05-26 — 홈 대시보드 + 휴가 페이지 UX 고도화

**홈 대시보드 3탭 리디자인**
- `apps/web/src/app/(app)/home/page.tsx` — searchParams 기반 탭 라우팅(`?tab=feed|news|tasks`), 전체 데이터 fetch
- `_components/home-tabs.tsx` — 탭 네비게이션, 할일 탭에 결재 대기 배지
- `_components/feed-tab.tsx` — 스탯카드 4개(결재대기/연차잔여/진행문서/알림) + 결재 대기 목록 + 최근 문서 + 사이드바(미니 캘린더 + 휴가 잔여 + 퀵링크)
- `_components/mini-calendar.tsx` — 클라이언트 미니 캘린더 (이전/다음달 이동, 오늘 하이라이트, 일/토 색상 구분)
- `_components/news-tab.tsx` — 회사소식 탭 (공지사항/인정 서브탭 빈 상태, 추후 모듈 연동)
- `_components/tasks-tab.tsx` — 할일 탭 클라이언트 서브탭 (해야할일=결재대기 / 요청한일=내문서IN_PROGRESS / 참조=빈상태)
- ⚠️ 타입체크 통과. 런타임 미검증.

**휴가 페이지 UX 고도화**
- `apps/web/src/app/(app)/leave/page.tsx` — 탭 구조(`?tab=dashboard|history`), 헤더 정비
- `_components/leave-tabs.tsx` — 탭 네비게이션, 대기 중 배지
- `_components/balance-section.tsx` — 잔여 카드 그리드: 진행 바(사용% 시각화) + 잔여 부족(≤3일)/소진 경고 배지 + 총 합산 요약
- `_components/history-tab.tsx` — 신청 내역 클라이언트 필터 (전체/대기중/승인/반려/취소 탭 + count 배지 + 취소 버튼)
- ⚠️ 타입체크 통과. 런타임 미검증.

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
