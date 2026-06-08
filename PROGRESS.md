# 진행 상황

> 세션 시작 시 이 파일을 먼저 읽고, 작업이 끝나면 **다음에 할 일** 섹션을 업데이트하세요.
> 상세 스펙은 `CLAUDE.md` + `/docs` 참조.

> 🎭 **2026-06-08 데모 모드 구현 완료**
> - `packages/db/seed/demo.ts` 전면 확장: 부서 5개·직책 5개·직원 13명(계정 3명+직원전용 10명)·휴가종류 3종(연차/병가/경조사)·결재이력 다양화(PENDING/APPROVED/REJECTED)
> - `demoLoginAction` 서버 액션 추가(`apps/web/src/lib/actions/auth.ts`)
> - 로그인 폼 하단 "데모 관리자로 체험 시작 →" 버튼 추가 (1클릭 자동 로그인)
> - `DemoBanner` 컴포넌트: 데모 계정 로그인 시 상단 DEMO 배너 표시·닫기 가능
> - **체험 시나리오**: S1 홈 13명 구성원·S2 결재 대기 승인·S3 HR 휴가 관리·S4 맞춤 부여·S5 구성원 상세 발령
> - 활성화: `pnpm db:seed` (NODE_ENV≠production 시 자동 실행). 기존 DEMO-0001 회사 있으면 건너뜀 → DB 리셋 후 재시드 필요
> - 타입체크 클린 (tsc exit 0)

> 🎨 **디자인 리뉴얼 ↔ 실제 앱 정합 — 1차 완료** → `docs/_handoff/디자인_리뉴얼_정합_핸드오프.md` 필독.
> 7개 영역(기반·home·leave·members·workflow·documents·settings+hr/leave) 정합/검증 끝. 전체 tsc 클린.
> 디자인 소스 = `C:\Users\PC\OneDrive\바탕 화면\teamlet (2)` (styles/ + app/*.jsx). 채용 제외. dev=localhost:3001.

> 🚀 **2026-06-05 대규모 세션 (Opus) — 휴가 심화 + 홈 재구성 + UI 통일** (전부 타입클린, dev 재시작 후 런타임 반영)
> **휴가**: 연차 정책 모달 보강(자동소멸 미리보기·툴팁·이탈확인) / 맞춤휴가 시간차 단위(`LeaveType.hourUnitMinutes`) / 관리자 **연차 조정**(부여·차감)·**부여 내역** 모달.
> **법정공휴일 자동 등록**: 공공데이터 특일정보 API 연동(`tenancy/holiday.ts` fetch+sync+range, 키=`DATA_GO_KR_SERVICE_KEY`). DB에 **2023~2027 양사 채움**(실 API). 설정 공휴일 연도별 표시 버그(state 미동기화) 수정 + 네비 하한 2023 + 자율휴일 폼 위로·날짜제한 해제. 홈/휴가 캘린더에 공휴일·주말 빨강 표시.
> **홈 재구성(공용 vs 개인)**: 탭 = 홈 피드/회사 소식/인정·피드백(할 일 탭 제거). 공지=공용, 인정·피드백·휴가=개인. 댓글 제거. 공지 노출(피드 필독1+최신1/최신2, 회사소식 4개 페이지네이션). 오늘의 소식=당일만(하루 지나면 사라짐).
> **인정·피드백 실기능**: 신규 모델 `Recognition`(개인 송수신) + 모듈/액션 + RecognitionTab(받은 메시지) + 동료전달 모달 작성(TargetPicker 수신자). 공지 읽음 추적(A안 `Employee.lastAnnouncementReadAt`).
> **UI 통일**: destructive 시맨틱 토큰 추가(bare `text-destructive` 등 전역 정상화) / 그라데이션 전멸(5원칙#1) / admin zinc→slate / **스크롤 일괄 통일**(`.app`·설정 layout 고정높이 → 탑바·사이드바 고정, `<main>`만 스크롤) / 구성원 검색 피커(TargetPicker — 신규합류/조직장 제거, 조직 클릭=구성원 펼침, DialogTitle a11y).
> **검색(⌘K)**: 오늘의 소식 제거 + **권한별 페이지**(일반=홈/휴가/문서증명서, `member.directory.manage` 보유 시 전체). 사이드바 IDM(구성원·워크플로우→인사관리), 구성원 아이콘 1인 수정. 문서 추가/삭제 권한 게이트.
> ⚠️ **스키마 3건 추가**(`hourUnitMinutes`/`lastAnnouncementReadAt`/`Recognition`) — **dev 서버 1회 재시작 필요**(완료됨). 미반영분은 try/catch degrade.
> **▶ 남은 휴가 로드맵**: #5 맞춤휴가 동적폼 잔여 · #6 관리자 모달(엑셀 등). + 브라우저 시나리오 검증.
>
> 🔧 **2026-06-05 후반 — 휴가 도메인 정밀화 (근로기준법 정확도)**
> - **연차 부여 엔진 버그 수정**: 1년 미만 입사자에 비례 일괄(7일) 부여 → §60② **월 1일 누적(입사직후 0)**. 1년+ = 법정 테이블(15·3년부터 2년마다+1·상한25). 정책 `monthlyGrantRule` 반영. 잘못 부여된 데이터 정리(annual 전체 wipe 후 재실행 가능).
> - **소멸·이월 정책 준수**: `processLeaveExpiry`가 정책 `annualExpiryMode`(소멸 안 함/부여1년후)·유예기간 따름(legacy expiryMonths 고정 제거). 소멸 안 함이면 스킵.
> - **근속 기간 컬럼**(휴가 관리): `completedMonthsSinceHire`(민법§160, 월말 입사 응당일=말일) export → 엔진·표시 **단일 함수 공유**. 매 렌더 실시간 갱신.
> - **UI**: 휴가 개요 휴가종류 9개 페이지네이션·예정신청 3건·신청 플로우(종류선택→등록)·잔여 hero Cool Blue. hr 부여/조정 = 구성원 피커(TargetPicker)+휴가종류 검색 피커. 인원 테이블 8명 스크롤. 전사→전체.

> ⚠️ **2026-05-29 전체 감사 완료 → `docs/07_감사보고서_2026-05-29.md` 필독.**
> 6개 도메인 코드 검증 결과 아래 표의 "✅완료"와 실제 상태에 격차 있음.
> + 디자인 명세 대비 갭(근태모듈/연차촉진/세션관리 등 전무) + 100%→120% 로드맵 정리됨.
> 자동화 테스트 0건.
>
> ✅ **CRITICAL 4건 수정 완료 (2026-05-29 같은 세션):**
> - **C1 IDOR** — career.ts 12함수 테넌트 격리 (타입클린)
> - **C2 Docker** — turbopack→webpack(build:standalone)+`.dockerignore`+누락패키지 → **이미지 빌드+컨테이너 기동(307) 실측 검증 완료**
> - **C3 소멸엔진** — 멱등 마커(`LeaveBalance.expiryProcessedAt`)로 year별 1회 처리 + adjustedDays→grantedDays (타입클린, 런타임 미검증)
> - **C4 가입알림** — 권한(member.directory.manage)기준 대상화+필터버그+deepLink (타입클린)
> - +부수: `MembershipStatus.REJECTED` 추가(반려기능 복구), bulk.ts import 수정 → **모듈 타입체크 전체 클린**, dev DB `db push` 적용
>
> **남은 CRITICAL: C5(Worker 빈껍데기) + §2 HIGH 8건(H3 해소).**
>
> ✅ **2026-06-01 세션 (토대 Phase 0 이어감):**
> - **C6 증명서 렌더버그** — 인쇄 버튼을 `print-button.tsx` 클라이언트 컴포넌트로 분리 (서버컴포넌트 onClick 차단 해소). 타입클린, 런타임 미검증
> - **H3 CC cross-tenant** — `createDocument`에서 참조자(ccRecipientIds)도 회사 소속 검증 추가 (결재자와 동일 패턴). 타입클린
> - **C7 결재정책 자동배정** — `resolveApprovalSteps` 신규(정책 step→실제 결재자 해석: SPECIFIC_PERSON/DEPARTMENT_HEAD/ORG_HEAD, DIRECT_MANAGER는 데이터 부재로 부서장 대체) + `createDocument`가 결재자 미지정 시 정책으로 자동 결재선 생성 + 작성 UI "정책 자동 배정/직접 지정" 토글. 모듈·웹 타입클린, 런타임 미검증. ⚠️ 휴가 bridge(requestLeave) 자동배정은 미적용(후속)
> - **H5 공지 작성 권한** — `company.announcement.manage` 권한 신규(시드 카탈로그) + `createAnnouncement` assertPermission 게이트(전 직원 작성 차단) + 홈 "동료에게 전달하기"의 공지 카드 비권한자에 "권한 필요" 비활성. 모듈·웹 타입클린. ⚠️ **dev DB `db:seed`(권한 upsert) + 기존 회사 `bootstrapCompanyRoles` 재실행 필요**(최고관리자에 자동 부여). 런타임 미검증
>
> - **H8 CSV HIRE 발령** — `bulkCreateEmployees`가 employee+HIRE 발령을 한 트랜잭션으로 생성(createEmployee와 일관). 발령이력 공백/Anti-Pattern #1 재발 차단. 모듈 타입클린
> - **H9 락아웃 가드 — 코드검증 결과 이미 해소** (변경 없음): `deactivateEmployee` 가드 보유 + UserRole 동시 비활성화, `updateRole`이 시스템역할 수정 차단, membership 활성멤버 정지경로 없음. 감사(05-29) 이후 추가된 것으로 확인
>
> **이번 세션 검증 수준: 코드 변경분 전부 타입체크 통과(모듈+웹 exit 0). 런타임/통합 미검증 — Phase 0.5 테스트 인프라에서 회귀 커버 예정.**
>
> **남은 토대: H6/H7(휴가 잔여계산 정합성·finalize 트랜잭션). 그 후 Phase 0.5 테스트 인프라(vitest).**

## 전체 진행도 (2026-05-28 세션3 기준)

| 영역 | 상태 | 비고 |
|---|---|---|
| 명세서 `/docs` | ✅ 100% | 00~06 7종, 6,050 lines |
| DB 스키마 + 시드 | ✅ P1~P5 + 확장 | 마이그레이션 12개 (`0_init` ~ `12_google_oauth`) + announcements/cc 테이블 (db push) |
| Shared 패키지 | ✅ 스키마 확장 중 | schemas: 사원/정책/휴가/양식/회사/공휴일/프로필/비밀번호 |
| UI 시스템 | 🟡 기초만 | theme + primitives 3 / patterns 3 |
| **디자인 시스템 전면 교체 (세션3)** | ✅ 완료 | Claude 디자인 파일 기반 전면 교체. `design.css` CSS 브리지 + Tailwind v4 CSS 변수 직접 사용. `AuthCard`, `KpiCard`, `DataTable` 등 컴포넌트 추가. 런타임 확인 완료. |
| **P1 인증/가입** | ✅ 완료 + 강화 | 이메일 2-step 로그인(이메일→다음→비밀번호) + 플랫폼 관리자 2단계 비밀키 + 회원가입 이름/이메일/연락처만 + 회사 문서 업로드. auth 6페이지 AuthCard 기반 교체. |
| **P1 권한** | ✅ 완료 | 평가/CRUD/UserRole/락아웃/부트스트랩 + isOrgHead 동적역할 + 권한 운영 UI(배정·매트릭스) ✓ |
| **P2 Core HR (구성원/조직/직책)** | ✅ 완료 | 탭 상세 + 확장 필드 + 상태/고용형태 필터 + CSV 일괄 등록 + 휴가·결재 탭 + **인사 발령 이력 탭** |
| **P3 휴가** | ✅ 디자인 교체 완료 | 히어로 카드 + 연간 분석 바 + 타입 그리드 + 신청 이력 탭 |
| **P3 휴가 정책** | 🟡 부분 | LeavePolicy CRUD·배정 + **연차 자동부여 엔진(MVP)** ✓ / 소멸·이월 미구현 |
| **P4 워크플로우** | ✅ 디자인 교체 완료 | DocKindBadge + WaitBadge + StepLine + SectionDivider + 3탭 |
| **P4 양식 빌더** | ✅ 완료 | FormTemplate CRUD + 필드 편집 UI (`/settings/form-templates`) |
| **P5 채용** | ✅ 강화 완료 | 공고 목록 + 상태 필터 + 후보자 목록/칸반/상세 + 메모 ✓ |
| **구성원 CSV** | ✅ 완료 | 가져오기 + 내보내기 (`/api/members/export`) |
| **P6 문서·증명서** | ✅ MVP 완료 | /documents 보관소 + /documents/certificates 발급/인쇄 ✓ |
| **P7 보안** | 🟡 강화 | 보안 정책 CRUD + 감사 로그 ✓ / **TOTP 2FA 개인 설정·로그인 검증 구현** / IP 제한은 정책 저장만(강제 미적용) |
| **P8 알림** | ✅ 강화 완료 | 알림 벨 패널 + /notifications 전용 페이지 (탭/읽음 처리) ✓ |
| **회사 설정** | ✅ 디자인 교체 완료 | 로고 카드 + set-card + 2열 필드 + 공휴일 4열 그리드 |
| **개인 설정** | ✅ 디자인 교체 완료 | 그라디언트 아바타 카드 + set-card + 2열 필드 |
| **설정 운영 페이지** | ✅ 디자인 교체 완료 | permissions/leave-policies/leave-types/approval-policies/form-templates/join-requests — set-card 패턴 |
| **⌘K 커맨드 팔레트** | ✅ 완료 | 구성원 검색 + 전체 페이지 네비게이션 |
| **홈 대시보드** | ✅ 완료 | 2-col grid + HomeRail + KPI + PostCard + 동료전달모달 + 공휴일 캘린더 |
| **구성원 페이지** | ✅ 완료 | KPI 4개 + 권한열 + 커스텀 필터 + 6종 재직상태 |
| **구성원 프로필** | ✅ 완료 | 3탭 + 7아코디언 + hero 5 quick chips + 사이드바 연동 |
| **조직·직책 설정** | ✅ 완료 | /settings/org 인라인 편집/삭제 |
| 도메인 권한 가드 | ✅ 완료 | 휴가/채용/증명서/문서/설정 모듈 assertPermission 적용 |
| **플랫폼 운영 콘솔** | ✅ 디자인 교체 완료 | `/admin` — 디자인 토큰 전체 교체 (zinc 제거) |
| **HR 휴가 관리** | ✅ 디자인 교체 완료 | 2열 레이아웃(테이블+상세패널) + KPI 4개 + 미적용 타입 점선 배지 ⚠️ 런타임 미검증 |
| **연차 소멸·이월** | 🟡 구현됨 | `processLeaveExpiry` + `ExpiryButton` — 정책 기반 소멸·이월 (멱등) ⚠️ 런타임 미검증 |
| **실시간 알림(SSE)** | ✅ 완료 | `/api/notifications/stream` — 15초 폴링 SSE + `NotificationBell` liveCount 구독 |
| **공지사항 수정/삭제** | ✅ 완료 | `AnnouncementActions` 드롭다운 (수정 다이얼로그·삭제·고정 토글), 작성자만 노출 |
| **결재 정책 관리** | ✅ 완료 | `ApprovalPolicy` 스키마 + 모듈 + `/settings/approval-policies` + db:push 완료 |
| **조직도 시각화** | ✅ 완료 | `/members/org-chart` RSC + `OrgTree` 클라이언트 컴포넌트 (트리 빌드 + 연결선) |
| Worker | ✅ 구현됨 | BullMQ + 스마트 연차 촉진 cron (KST 09:00) — 런타임 미검증 |

## 전체 진행도 업데이트 (2026-05-29 세션)

| 영역 | 상태 | 비고 |
|---|---|---|
| **홈 대시보드** | ✅ 완료 | 동료 전달 모달 + 이벤트 행(.event-row) + 반응 버튼 + 소식탭 KPI + 공휴일 캘린더 |
| **구성원 목록** | ✅ 완료 | 4 KPI + 권한 열 + 커스텀 드롭다운 필터 + 재직상태 6종 |
| **구성원 프로필** | ✅ 완료 | 3탭(기본정보/발령이력/권한) + 7 아코디언 + hero 5 quick chips |
| **조직·직책 설정** | ✅ 완료 | /settings/org — 부서·직책 인라인 이름변경/삭제 |
| **사이드바 유저 박스** | ✅ 완료 | 클릭 시 본인 프로필(/members/{id})로 이동 |

## 2026-06-01 세션2 — 기능 빌드 전환 (파일 업로드 MinIO)

> 사용자 지시: Flex 분석+디자인대로 **모든 기능 빌드**. 시작 트랙 = 파일 업로드(MinIO).

**파일 업로드 인프라 (로고/프로필/문서/이력서/증명서PDF 공용)**
- `apps/web/src/lib/storage.ts` (NEW): `@aws-sdk/client-s3` MinIO 클라이언트(forcePathStyle) + `ensureBucket`(멱등, dev public-read 정책) + `uploadObject(key,body,type)→URL` + `sanitizeFilename`
- `apps/web/src/app/api/uploads/route.ts` (NEW): POST multipart 업로드 — auth 게이트 + 타입(pdf/이미지/office/txt/csv) + 10MB 제한 + scope 화이트리스트(company-documents/logos/profiles/certificates/resumes/employee-documents) + 키 `{scope}/{companyId}/{uuid}-{name}` 반환 URL
- `apps/web/src/lib/upload-client.ts` (NEW): 클라이언트 `uploadFile(file, scope)` 헬퍼 (재사용)
- `components/document/add-document-button.tsx`: "파일 URL 수동입력" → **파일 선택 업로드**로 교체 (업로드 중 표시, 첨부 파일명, 제목 자동완성)
- `@aws-sdk/client-s3` apps/web 의존 추가 (+47 pkg)
- ⚠️ **타입체크 통과(web exit 0). 런타임 미검증 — Docker Desktop 미기동(`pnpm docker:up` 필요).**
- ⚠️ **dev 전제: 버킷 public-read.** 운영은 private + presigned/인증프록시 전환 필요(storage.ts 주석 명시)

**소비처 연결 (동일 `uploadFile` 패턴)**
- ✅ **회사 문서함** — `add-document-button` 파일 선택 업로드
- ✅ **회사 로고** — `company-info-form` 로고 카드 "준비 중" → 실제 업로드+미리보기. `companyUpdateSchema`/`CompanyUpdateInput`/`updateCompanyInfo`에 `logoUrl` 추가(shared+모듈), SVG 제외(라우트 허용목록·XSS). 모듈+웹 타입클린
- 📌 남은 소비처(후속): 프로필 사진 / 증명서 PDF / 이력서·직원제출문서
- ⚠️ **전부 타입체크만 통과(런타임 미검증) — MinIO 미기동. `pnpm docker:up` 후 실제 업로드 1회 검증 필요.**

## 2026-06-01 세션3 — 휴가 Flex 갭 분석 & 구현 준비 (Opus 파악 페이즈)

> 사용자 지시: **휴가 → 홈 → 구성원** 순으로 디자인+Flex 기능에 맞춰 "제대로 동작"하게 개발.
> 이 세션(Opus)은 **파악·설계 전담**. 구현(기능개발)은 **Sonnet으로 전환해 이어감**.

**완료한 파악 (전부 `docs/08_휴가_Flex갭분석.md`에 정리)**
- Flex 휴가 화면 캡처 89장 분석(내 휴가 3탭 + 신청 모달 + 연차/맞춤휴가 설정 전체) — 3 에이전트 병렬
- 연차/월차 촉진 = `[flex webinar] 2025 연차촉진 웨비나자료.pdf` 정밀 분석(법정 절차·1·2차·회계일/입사일·전자문서 효력·FAQ 엣지케이스)
- 우리 코드/스키마 대조: **모델은 Flex 수준(부여방법 6종·단위·급여·성별·증명 enum 다 존재), UI/엔진이 못 따라감**이 갭의 본질
- **법정의무휴가 자동등록 확인**: `tenancy/approval.ts:122` `bootstrapCompanyLeaveTypes()` 동작 중. 단 시드 8종 → Flex 11종 대비 **3종 누락**(산전후 다태아·유산사산·유산사산 다태아)
- 디자인 패키지 흡수: `C:\Users\PC\OneDrive\바탕 화면\인사관리\`(flex-analysis.md + Hi-Fi HTML/JSX + 토큰). 촉진 4상태 칸반·side sheet·3중 인코딩 등 `docs/08 §7-2`

**구현 우선순위 (Sonnet이 이 순서로 진행 — 상세는 `docs/08 §7`)**
1. **연차 상세 탭** ⚡ — 데이터(`LeaveTransaction`) 이미 있음, 집계+UI만. 디자인 = `My Leave Hi-Fi.html`
2. **휴가 신청 모달** — 일수 자동계산(공휴일 제외 영업일) + 반차/시간차 + 다단계 결재선(`RecipientPicker` 재사용)
3. **맞춤 휴가 폼 확장** — 성별·증명(모델 O/UI X) + 사용단위 + 추가설정 + 부여방법 동적폼
4. **연차 설정 심화** — 소멸 유예(월차/연차 분리)·당겨쓰기·퇴직자 기준 (모델 확장 필요)
5. **월차·연차 촉진** — 모델·엔진·worker 스케줄러·화면 신규 (법정 절차, 정확도 최우선, 마지막)

**Sonnet 착수 지점 (#1 — 일부 선작업됨)**
- ✅ `packages/modules/src/leave/types.ts` — `AnnualLeaveLedgerRow`·`AnnualLeaveLedger` 타입 추가됨
- ⬜ `balance.ts`에 `getAnnualLeaveLedger(employeeId, year)` 구현: 연차 `LeaveType`의 해당연도 `LeaveTransaction`을 월별 그룹핑(GRANT/EXPIRE/USE/ADJUST) + 누적 잔여 + 입사월/현재월 마커 + 요약
- ⬜ `index.ts` export 추가
- ⬜ `/leave/page.tsx` `VALID_TABS`에 `"detail"` 추가 + ledger fetch + `<AnnualDetailTab>` 렌더
- ⬜ `_components/leave-tabs.tsx`에 "연차 상세" 탭 추가
- ⬜ `_components/annual-detail-tab.tsx` 신규(요약 카드 4개 + 월별 테이블, `My Leave Hi-Fi.html` 스킨)

**보완 사항(별도)**: 법정휴가 시드 3종 추가(`seed/leave-types.ts`) — 신규 회사 자동 반영, 기존 회사는 재부트스트랩 필요

## 2026-06-01 세션4 — 휴가 기능 구현 (Sonnet)

**구현됨 (타입체크 통과, 런타임 미검증)**
- ✅ `packages/modules/src/leave/types.ts` — `AnnualLeaveLedger`/`AnnualLeaveLedgerRow` 타입 + `CompanyLeaveRequestItem`에 `formDocumentId` 추가
- ✅ `packages/modules/src/leave/balance.ts` — `getAnnualLeaveLedger()` 집계 함수 (월별 GRANT/EXPIRE/USE/ADJUST + 누적 잔여 + 입사월/현재월 마커)
- ✅ `packages/modules/src/leave/index.ts` — `getAnnualLeaveLedger`, `AnnualLeaveLedger`, `AnnualLeaveLedgerRow` export 추가
- ✅ `packages/modules/src/leave/request.ts` — `listCompanyLeaveRequests` 매핑에 `formDocumentId` 포함
- ✅ `apps/web/src/app/(app)/leave/page.tsx` — 3탭(개요/연차상세/신청이력) + 연도 파라미터 + `getAnnualLeaveLedger` fetch
- ✅ `apps/web/src/app/(app)/leave/_components/leave-tabs.tsx` — 연차 상세 탭 추가 + year 파라미터
- ✅ `apps/web/src/app/(app)/leave/_components/annual-detail-tab.tsx` — 신규: 요약카드 4개 + 월별 원장 테이블 + 연도 네비게이터
- ✅ `apps/web/src/components/leave/leave-request-button.tsx` — 날짜→일수 자동계산(공휴일/주말 제외) + 반차(오전/오후) + 승인 요청하기
- ✅ `apps/web/src/lib/actions/leave.ts` — `getHolidayDatesAction` 추가
- ✅ `apps/web/src/app/(settings)/settings/leave-types/_components/leave-types-client.tsx` — 부여방법 라벨 개선 + 성별/증명 필드 추가 + 추가설정 접이식 섹션 + 목록 컬럼 확장
- ✅ `apps/web/src/app/(app)/hr/leave/_components/requests-table.tsx` — 기본 탭 "대기"로 변경 + 결재함 링크 + 승인/반려 버튼 + 대기 배너
- ✅ 데모 시드 `annual_demo` → `annual` key 변경 (DB 직접 적용)
- ✅ `hr@teamlet.test` 계정에 `leave.balance.manage`, `leave.adjust.execute`, `leave.policy.read`, `leave.type.read` 권한 추가 (DB 직접 적용)

## 2026-06-01 세션5 — 휴가 도메인 통합 설계 + 스키마 토대 (Opus) ★

> 사용자 지시: Flex 3폴더 전수 분석 → 휴가 도메인 **모든 기능·화면·모달·선택지·연계**를 완벽 설계. **개발은 Sonnet**으로 이어가되 **이 설계대로** 진행.

**설계 — `docs/09_휴가도메인_통합설계.md` (휴가 구현 단일 기준 SSOT)**
- Flex 캡처 전수 분석: `flex`(347장 전영역) + `flexv2`(97 휴가심층) + `teamlet`(37 관리자뷰) — 8 에이전트 병렬
- 휴가 종류 마스터 18~19종 / 연차설정(정책·부여방식·소멸·촉진·퇴직자) / 맞춤휴가(승인참조·추가설정·동적폼) / 내휴가(신청 2단계 플로우·연차상세·사용계획) / 휴가관리 4탭 / 촉진 7상태 / 승인참조 공통피커 / 연계(워크플로우·알림·승인정책·worker) 전부 verbatim 정리
- 화면별 모든 모달·이벤트·드롭다운 선택지 문구 포함

**스키마 step 0 완료 — `db push` 적용 + 타입체크 클린 ✅ (런타임 미검증)**
- enum 추가: `LeaveUseUnit`, `MonthlyExpiryMode`, `AnnualExpiryMode`, `RetirementAdjustMode`, `LeavePromotionType`, `LeavePromotionStatus`
- `LeaveType` 확장: `useUnit`·`partialPayPercent`·`deductOnHoliday`·`periodicCycle`·`tenureYears`·`excludedEmploymentTypes[]`·`excludedDepartmentIds[]`·`approverEmployeeId`(고정 승인자)·`ccEmployeeIds[]`
- `LeavePolicy` 확장: `grantStartDate`·`useUnit`·`hourUnitMinutes`·`overdraftEnabled`·`overdraftMaxDays`·`monthlyExpiryMode`·`monthlyGraceMonths`·`annualExpiryMode`·`annualGraceMonths`·`approveOnRegister`·`approveOnCancel`·`approverEmployeeId`·`ccEmployeeIds[]`·`smartPromotionEnabled`
- `LeaveRequest` 확장: `unitType`·`startTime`·`endTime`·`evidenceFileUrl`
- 신규 모델: `CompanyLeaveSettings`(퇴직자 조정+촉진 설정) / `LeavePromotion`(촉진) + `LeavePromotionPlanDate`(사용 희망일)
- Employee 역관계: `leaveTypesAsApprover`·`leavePoliciesAsApprover`·`leavePromotions` / FormDocument: `leavePromotion`

### ⏭️ Sonnet 구현 로드맵 (docs/09 §9 순서 — **이 설계대로**)
> 모든 화면은 `docs/09` 해당 섹션의 verbatim 문구·선택지·플로우를 그대로 구현. 디자인은 `teamlet-design.css` 토큰 + docs/08 §7-2.
1. ✅ **맞춤 휴가 설정 완성** — 세션6 완료
2. ✅ **휴가 신청 모달** — 세션6 완료
3. ✅ **연차 설정** — 세션6 완료
4. ✅ **퇴직자 조정 + 연차 촉진 설정** — 세션6 완료
5. ✅ **휴가 관리(관리자) 4탭** — 세션7 완료 (보유현황/사용내역/월별연차/연차촉진)
6. ✅ **촉진 엔진(worker)** — 세션7 완료 (법정 소멸일 계산 + BullMQ cron, 런타임 미검증)
7. **승인·참조자 공통 피커** 통합 (Anti-Pattern #10). → §7
- 별도: 법정휴가 시드 누락분 보완(`seed/leave-types.ts`)

## 2026-06-01 세션6 — 휴가 설정 완성도 + 버그 수정 (Sonnet)

**구현됨 (타입체크 통과, 런타임 검증 진행 중)**

### 맞춤 휴가 (#1 완성)
- `leave-types-client.tsx` — `useUnit`(DAY/HALF_DAY/HOUR) select 교체(`useAllAtOnce` 제거) + `ccEmployeeIds` 참조자 UI + submit 반영
- `leave-types/page.tsx` — `key !== "annual"` 필터 (연차는 연차 설정에서만 관리)

### 휴가 신청 모달 (#2 완성)
- `leave-type-cards.tsx` — 헤더 문구: 다일 선택 시 "· 하루 종일" 제거 → `{fmtDate(start)}{start !== end ? ` – ${fmtDate(end)}` : ` · ${unitLabel}`}`
- 사용 단위 옵션: 단일 날짜일 때만 반차/시간차 노출 (다일 = "하루 종일"만)
- 종료일 변경 시 unit 자동 리셋
- 증명 자료 파일 업로드 (사유 아래): `uploadFile("employee-documents")` + 파일명 표시 + 제거 버튼
- `RequestLeaveInput.evidenceFileUrl` 추가 → `requestLeave` DB 저장 + 액션 전달

### 연차 설정 (#3 완성)
- `policy.ts` — `LeavePolicyItem`/`CreateInput`/`UpdateInput` 새 필드 14개: useUnit·hourUnitMinutes·overdraftEnabled·overdraftMaxDays·monthlyExpiryMode·monthlyGraceMonths·annualExpiryMode·annualGraceMonths·approverEmployeeId·ccEmployeeIds·approveOnRegister·approveOnCancel·smartPromotionEnabled
- `leave-policies-client.tsx` 전면 재작성 (docs/09 §3-2~3-4): 기본설정(승인자+참조자+승인시점+사용단위+당겨쓰기) + 연차부여방식(접이식) + 자동소멸(접이식) + 스마트연차촉진
- `leave-policies/page.tsx` — 제목 "연차 설정" + employees fetch + annualTypeId 전달
- **연차 유형 자동 upsert**: 페이지 로드 시 `annual` 없으면 prisma 직접 생성 (서버사이드, 항상 실행)
- `scripts/seed-annual.mjs` — DB에 annual 타입 직접 삽입 (모든 회사 적용 완료)
- `KR_STATUTORY_LEAVE_TYPES`에 `annual` 추가 (신규 회사도 자동 부트스트랩)

### 퇴직자 조정 + 연차 촉진 설정 (#4 완성)
- `company-leave-settings.ts` 모듈 + `company-leave-settings.ts` 액션 신규
- `CompanyLeaveSettingsSection` — 퇴직자 조정 모달(동적 ✓ 예시 테이블) + 연차 촉진 설정 모달(§3-5,3-6)
- 퇴직자 모달 예시: 모드에 따라 ✓ + 녹색 하이라이트 동적 반영

### 연차 자동부여 엔진 개선
- `auto-grant.ts` — 기본 정책 fallback (미배정 구성원에게도 자동 적용)
- `grantAmount=null`일 때 법정 연차 계산: 1년미만=11일, 1년+=15일, 3년+2년마다+1(max25일)
- `noPolicyCount`: 기본 정책 있으면 항상 0 (전체 구성원 대상)

**⚠️ 런타임 검증 진행 중 — dev 서버 재시작 후 연차 자동부여 테스트 필요**

## 2026-06-02 세션7 — 휴가 관리 4탭 + 촉진 엔진 + Flex verbatim 전수 전사 (Sonnet→Opus) ★

> 사용자 지시: Flex 기능·**문구·이벤트별 모달·선택지**를 **그대로** 가져와 휴가를 완벽히 닫는다. 시간·비용 무관, 정확도 최우선.

**구현됨 (타입클린, 런타임 미검증)**
- ✅ `approverId` optional — 승인자 미지정 시 자동 승인 (`d9182a6`)
- ✅ **휴가 관리 4탭 완성** (`39a5f8d`): 월별 연차(`monthly-annual-table`) + 연차 촉진(`promotion-table`) + `listCompanyLeavePromotions`/`cancelLeavePromotion`
- ✅ **스마트 연차 촉진 엔진 + worker** (`0364c81`): `promotion-engine.ts`(법정 소멸일 계산 회계일/입사일 + 연차/월차1·2차 LeavePromotion 자동생성, 멱등) + BullMQ cron(매일 KST 09:00). Worker 빈껍데기 해소.

**Flex 원본 verbatim 전수 전사 (SSOT 완성) — `docs/_transcribe/`**
- 원본 캡처 SSOT = 바탕화면 4폴더(flex 347 + flexv2 97 + teamlet 37 + 새폴더 13 = 494장). [[project_teamlet_flex_ssot]]
- **flexv2 97장 전수 전사** → `docs/_transcribe/flexv2.md` (783줄): 신청모달 전단계·연차상세·사용계획빈상태·연차정책편집·승인참조피커·부여방식·자동소멸·촉진설정·맞춤휴가 동적폼 全 verbatim
- **teamlet 37장 전수 전사** → `docs/_transcribe/teamlet.md` (402줄): 관리자 휴가관리 4탭·맞춤휴가부여·연차조정·부여내역·엑셀다운로드·촉진/사용계획상세 + xlsx 템플릿 verbatim
- ⚠️ 촉진 **응답 작성폼**(구성원)은 원본에 빈상태만 → 관리자 상세([28]) 구조 기반 설계 필요

### ⏭️ 휴가 완성 로드맵 (docs/_transcribe SSOT 기준 — verbatim 그대로)
> 모든 문구·선택지는 `docs/_transcribe/{flexv2,teamlet}.md` 해당 화면 verbatim 복제. 의역 금지.
1. ✅ **공통 승인·참조자 피커** (`RecipientPicker`) — `451b032`·`c3cdde0`. `components/common/recipient-picker{,-types}.tsx`. 칩(요청자별승인/변경허용)·참조+알림드롭다운(3종)·N단계승인·대상피커(검색/구성원목록/부서그룹/하위조직함께선택). **3개 소비처 연결**(맞춤휴가·연차정책·촉진설정). 저장은 toLegacy로 기존 approverEmployeeId+ccEmployeeIds 호환. web 타입클린 + 라우트 컴파일 307. ⚠️ 브라우저 상호작용 미검증 / 1~5차 조직장·다단계 저장은 후속(스키마)
2. ✅ **촉진 응답 플로우** — `81e1cd7`. FormDocumentKind+=LEAVE_PLAN(db push). 모듈 `getMyLeavePromotions`/`submitLeavePlan`/`getLeavePromotionDetail`/`finalizeLeavePlanFromDocument` + 워크플로우 approve/reject 연동. 구성원 `/leave` "연차 사용 계획" 탭(빈상태 verbatim + 희망일 선택→제출), 관리자 촉진탭 [보기]→상세패널(teamlet[28] verbatim). web+modules 타입클린 + 라우트 컴파일 307. ⚠️ 브라우저 미검증 / 진행상태 "작성 기간 전"은 우리 엔진(촉진시점 도달 시 생성)상 불필요 → 7종 유지 / 댓글 입력은 후속
3. ✅ **신청 모달 보강** — `e5e7745`(1/2) + 진행중(2/2):
   - ✅ 듀얼 캘린더(`dual-calendar.tsx`): 이번달·다음달, 시작→종료 클릭, 주말·공휴일 색. date input 교체
   - ✅ 확인화면 결재자 문구 2분기(#14/#97): 참조 유무 분기. `LeaveTypeItem.ccNames` + listLeaveTypes 참조자 이름 조회
   - ✅ **상세 일정 편집 서브모달**(B안 완전): `LeaveRequest.schedule` Json 추가(db push) + `LeaveScheduleEntry` 타입 + `RequestLeaveInput.schedule`/requestLeave 저장(days 합산·대표 unitType 도출) + 조회 반영(listMy/listCompany) + `schedule-editor.tsx`(날짜별 하루종일/오전반차/오후반차/시간차 + ☕) + RequestDialog 통합("상세 일정 편집이 필요한가요? ›"). **web+modules 타입클린.**
   - ⏭️ **남은 2/2**: 사용 내역 표시에 schedule 반영(history-tab·hr requests-table에서 날짜별 단위 노출). 현재는 저장·조회까지 완료, 표시 UI 미반영. **런타임 미검증(브라우저).**
   - 📌 별도: 사용자 요청 — **디자인 어긋남·글씨 세로 출력(깨짐) 점검·수정**(런타임에서 확인 필요)
4. **연차 정책 모달 보강** — flexv2 §F/I: 당겨쓰기(자유롭게/사용량제한+최대N일+안내+툴팁) · 자동소멸 미리보기테이블(법정/실제×월차/연차)+툴팁2종+소멸시점·유예기간 드롭다운 · 이탈확인 `정말 그만할까요?` · 시간단위 드롭다운(1분~2시간,30분추천)
5. **맞춤 휴가 동적폼 보강** — flexv2 §M: 반복부여(매년/매월 시점 옵션)·근속시부여 시점 · 시간차단위(제한없음~) · 일부유급 % 입력 · 이탈확인 `변경사항을 저장하지 않고 나가시겠어요?`
6. **관리자 모달** — teamlet §: 맞춤휴가부여 모달(종류/시간단위/대상/사용기간토글) · 연차조정 5항목 · 부여내역(부여건별/대상자별/일괄변경) · 엑셀다운로드 모달 · 연차사용내역 업로드 모달(+xlsx 양식)

## 2026-06-04 세션2 — Flex 347장 전수 전사 + 디자인 재정립 핸드오프 패키지

**Flex 전수 분석 (15배치 병렬 에이전트)**
- ✅ **flex 347장 전수 전사** → `docs/_transcribe/flex.md` (5,213줄): 전 도메인 verbatim 문구 + 선택창/드롭다운/모달 전 옵션 + 이벤트 동작 + 디자인 참고 + "왜 존재하는가"(법적·실무 근거). 파트별 원본은 `_flex_parts/part-01~15.md` 보존
- 기법: 1920×1080 캡처는 Read 다운스케일로 글자 흐림 → PIL/.NET 크롭+확대로 정밀 판독
- 핵심 발견: ① 휴가/근무/구성원정보/워크플로우가 단일 `FormDocument.document_kind`+`ApprovalPolicy.category` 통합(우리 설계와 일치) ② RecipientPicker 전 도메인 재사용 ③ 시점이력(기준일/적용일/발령 전후) UI 전반 ④ 연차 부여방식·소멸·촉진이 법정 근거 동반 정책 테이블화 ⑤ Flex 초록→청록 그라데이션 = 우리 5원칙 위반 → Cool Slate 변주 필요
- ✅ **디자인 수정방안** → `docs/_handoff/04_디자인_수정방안.md` (317줄): Flex→Teamlet 변주 매핑표 + 도메인별 갭&수정안 + 공통컴포넌트 재정립 + design.css 위반 행번호(`--purple #7c3aed` 30·31행, 아바타 그라데이션 264·776·510행) + P1~P3 로드맵

**핸드오프 패키지 → `C:\Users\PC\Downloads\teamlet-design-handoff[.zip]`**
- 01_flex_전사_SSOT (flex/flexv2/teamlet/new-folder 4종) + 02_우리_설계(05·09·CLAUDE) + 03_현재_teamlet_디자인(css+ui-components, 압축본 포함) + 04_디자인_수정방안 + README
- 용도: Claude 디자인으로 디자인·기능 재정립 업그레이드 입력 자료

## 2026-06-04 세션 — schedule 표시 + 디자인 수정 + 하네스 엔지니어링

**완료 (타입클린)**
- ✅ **#3 2/2**: `history-tab.tsx` + `requests-table.tsx` — `schedule` 날짜별 단위 표시 (`ScheduleDetail`/`ScheduleCell` 컴포넌트)
- ✅ **디자인 버그 수정 5건**: `var(--warning)→--warn)` / `.hist-row` 4열 정렬 / `.bd-legend .remaining i` / `.st.end` CSS / `.hist-row .desc` 오버플로우
- ✅ **CommandPalette 이벤트 미리보기**: 열릴 때 생일·기념일·신규합류 카드 (빈 상태 대체)
- ✅ **RecipientPicker TargetPicker 강화**: 빈 상태 "오늘의 소식" 이벤트 카드 + 컬러 아바타
- ✅ **하네스 엔지니어링**: `.github/` PR·이슈 템플릿 + `.git/hooks/commit-msg`(Conventional Commits) + `pre-push`(typecheck) + `scripts/track-antipattern.ps1`(3회↑→hook 추가) + `.claude/settings.json`(Anti-Pattern PostToolUse 감지)

### ⏭️ 다음 세션 착수 지점
- **#4 연차 정책 모달 보강** — flexv2 §F/I: 당겨쓰기·자동소멸 미리보기테이블·시간단위 드롭다운
- **#5 맞춤 휴가 동적폼** — flexv2 §M: 반복부여·근속시부여·일부유급% 등
- **#6 관리자 모달** — 맞춤부여·연차조정·부여내역·엑셀다운로드
- **런타임 검증**: 브라우저에서 RecipientPicker 이벤트 카드·CommandPalette 미리보기 확인 필요

## 2026-06-08 세션 — 휴가 완성 로드맵 #5·#6 구현 (Opus 선작업 → Sonnet 구현)

**완료 (타입체크 통과, DB push 완료)**

### #5 맞춤휴가 PERIODIC 동적폼 (세션 이전 Opus 선작업 → Sonnet 완성)
- `leave-types-client.tsx` — PERIODIC 섹션 2단계 선택 UI: 매년(annually_from_hire/2~5년차 5종) + 매월(monthly_from_hire/2~11개월차 11종) + 안내문구 verbatim(flexv2 §M)
- `periodicType: "annually" | "monthly"` FormState 추가, 근속시부여 `입사일 기준` 토글 추가

### #6 관리자 모달 전면 구현
- ✅ **6a. 맞춤 휴가 부여 내역 전체 화면** — `grant-history-full-view.tsx`: 뷰 토글(부여건별/대상자별) + 연도/휴가종류 필터 + 일괄변경 드롭다운 + `?view=grant-history` searchParam으로 page.tsx에서 분기
- ✅ **6b. 엑셀 다운로드 모달** — `grant-download-modal.tsx`(필터 UI: 부여기간/부여자/부여대상자/휴가종류 멀티셀렉트/휴가상태/만료여부) + `app/api/hr/leave/export/grants/route.ts`(exceljs xlsx 생성, 스타일링 포함)
- ✅ **6c. 연차 사용 내역 업로드** — `usage-upload-modal.tsx`(단위 토글 일·시간·분/소수점 + 드롭존) + `app/api/hr/leave/export/usage-template/route.ts`(양식 다운로드, 안내시트 포함) + `app/api/hr/leave/import/usage/route.ts`(**BulkOperation 경유** Anti-Pattern #11 준수, 행별 검증/적용, auditLog)
- ✅ **6d. 연차 조정 ▾ 드롭다운** — `adjust-leave-dropdown.tsx`: 조정(연차조정/재직자정산용/퇴직자정산용) + 조정내역(연차조정내역/재직·퇴직자잔여조정내역) verbatim
- ✅ **GrantLeaveDropdown** — `grant-leave-dropdown.tsx`: 맞춤 휴가 부여 + 부여 내역 통합 드롭다운, 기존 `GrantLeaveButton`+`GrantHistoryButton` 대체

### 스키마 변경 (db push 완료)
- `LeaveTransaction`: `usableFrom DateTime?` + `usableUntil DateTime?` 추가
- `BulkOperation`/`BulkOperationRow` 모델 신규 (Anti-Pattern #11 인프라). `BulkOperationType`(LEAVE_GRANT_IMPORT/LEAVE_USAGE_IMPORT/EMPLOYEE_CREATE) + `BulkOperationStatus` + `BulkRowStatus` enum
- `Company.bulkOperations` + `Employee.bulkOperations` 역관계

### 버그/리팩토링
- `completedMonthsSinceHire` → `leave-date-utils.ts` 분리(Prisma 의존 제거) → `fs` 모듈 클라이언트 번들 오류 해소
- `monthly-annual-table.tsx` — `연차 사용 내역 업로드` 버튼 + UsageUploadModal 연결
- **로그인 페이지**: Google 버튼 → "AxHub로 계속하기" 버튼(disabled, AxHub API 연동 준비 후 활성화 예정)

### ⏭️ 남은 작업
- **런타임 검증** — 브라우저에서 6a/6b/6c/6d 전체 시나리오 테스트
- `usableFrom`/`usableUntil` UI 연결 — 맞춤부여 모달에서 사용기간 입력 → DB 저장, 6a에서 표시
- 조정내역/재직·퇴직자 정산 내역 화면 구현 (6d 메뉴 아직 준비중 상태)
- AxHub 로그인 OAuth 연동 (AxHub 인프라 준비 후)

## 현재 위치

- **Phase**: 휴가 완성 로드맵 구현 완료 → 런타임 검증 단계
- **브랜치**: `main`
- **원격**: `https://github.com/kimyumin03/Teamlet.git`
- **마지막 세션**: 2026-06-08 휴가 #5·#6 + BulkOperation 스키마 + AxHub 로그인 UI
- **dev 서버**: `http://localhost:3001` (포트 3001 고정)
- **스키마**: db push 적용됨 (LeaveTransaction usableFrom/Until, BulkOperation/Row 신규)
- **AxHub 연동 예정**: 향후 AxHub 구성원·회사 데이터를 teamlet에 sync 예정. `sync_locked_fields` 우회 금지.

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

### ✅ 완료 (2026-05-28 — 디자인 시스템 교체)
- **전체 디자인 토큰 교체** — zinc/slate 하드코딩 → `foreground/background/border` 토큰 + 뱃지 `border` 통일 (컴포넌트 57개)
- **홈** — 2-col grid + HomeRail 340px + 히어로 인사말(웨이브) + KPI 카드 + PostCard + 탭(홈피드/회사소식/할일)
- **구성원** — KPI 카드 3개 + 뷰 토글(리스트/조직도) + MembersFilterBar + 전체 테이블(체크박스·아바타·상태 배지)
- **워크플로우** — DocKindBadge + WaitBadge(D+n) + StepLine + SectionDivider + 3탭(결재대기/내가요청한/완료·참조)
- **개인 휴가** — 그라디언트 히어로 카드(연차 잔여 56px) + 연간 분석 바 + 타입 그리드 + 탭("휴가 개요/신청 이력")
- **HR 휴가 관리** — 2열 레이아웃(테이블+상세패널 360px) + KPI 4개 + 미적용 타입 점선 배지
- **설정 프로필** — 그라디언트 아바타 카드 + set-card 구조 + 220px 레이블 2열 필드
- **설정 회사 정보** — 로고 업로드 카드 + 읽기전용 카드 + set-card + 2열 필드
- **설정 공휴일** — 4열 그리드(날짜·이름·타입 배지·버튼) + 법정(destructive)/회사(purple) 배지
- **설정 운영 6페이지** — permissions/leave-policies/leave-types/approval-policies/form-templates/join-requests — set-card 패턴 + h3 + 설명
- **설정 네비게이션** — 회사 그룹 ADMIN 배지 추가
- **어드민 콘솔** — zinc 완전 제거 → 디자인 토큰

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

### 📌 구성원 AxHub 연동 (TODO)
- **구성원 데이터 AxHub API 동기화** — 나중에 axhub API로 구성원 데이터를 가져와서 추가할 예정. `sync_locked_fields` 우회 금지. 현재는 수동 등록만.

### 📌 홈 페이지 미완 (TODO)
- **공지 댓글 기능** — DB 모델(Comment) + API + 댓글 목록 UI (현재 클라이언트 반응만 구현)
- **왼쪽 사이드바 근무중 바** — "근무중 09:12 · 2h 47m" 근태 타이머 (근태 모듈 미구현)

### 🟢 LOW — 선택적 강화
- 채용 depth (지원서 양식·이력서 첨부·면접 일정·스코어카드)
- 파일 업로드(S3)·이메일 발송 실연동
- 모바일 반응형 (웹 우선이라 후순위)

## 최근 한 일

### 2026-05-29 — 구성원 프로필 재설계 + 조직 설정 + 사이드바 연동

**구성원 프로필 (3탭 + 7 아코디언)**
- `members/[id]/page.tsx`: RSC 간소화 (데이터 fetch만)
- `members/[id]/_components/profile-shell.tsx` (NEW): 클라이언트 ProfileShell
  - hero 섹션: 아바타 + 이름 + 상태 + 5 quick chips (사번/입사일/연차잔여/이메일/계정상태)
  - 3탭: 기본정보 / 발령이력 / 권한 (URL param → useState)
  - 기본정보 탭: 7 아코디언 (기본정보/인사정보/휴가잔여/휴가이력/결재문서/경력·학력/가족)
- `design.css`: `.profile-hero`, `.profile-chips`, `.profile-tabs`, `.accordion`, `.pf-grid` 추가

**조직·직책 설정 페이지 (/settings/org)**
- `packages/modules/src/position/index.ts`: `updatePosition` 함수 추가
- `lib/actions/position.ts`: `updatePositionAction` 추가
- `settings/org/page.tsx` (NEW): RSC
- `settings/org/_components/org-client.tsx` (NEW): 인라인 이름 변경 + 삭제 UI
- `settings-nav.tsx`: "조직·직책" → `/settings/org` 연결

**구성원 목록 개선**
- 재직 상태 필터: 6종 (재직/수습/휴직/파견/입사예정/퇴직)
- 커스텀 드롭다운 (appearance-none + 둥근 리스트)
- "전사" → "전체" 문구 통일
- `DYNAMIC_ORG_HEAD` → "부서장 권한 자동 부여" 한국어화
- KPI 4번째: 권한 미배정 인원

**사이드바 유저 박스 연동**
- `AppSidebar`: `employeeId` prop 추가
- 아바타/이름 클릭 → `/members/{employeeId}` 이동

⚠️ 런타임 검증 완료 (프로필 페이지 로드 확인)

### 2026-05-29 — 홈 페이지 완성 (동료 전달 모달 + 공휴일 캘린더)

**홈 빠진 기능 추가**
- `components/home/send-to-colleague-button.tsx` (NEW): "동료에게 전달하기" 액션 허브 모달 — 공지사항(인라인 작성) / 할일요청 / 작성요청 / 인정(준비 중) / 피드백(준비 중) 5개 카드
- `home/_components/mini-calendar.tsx`: `holidays` prop 추가 — 공휴일 날짜 빨간 dot + 빨간색 텍스트
- `home/_components/home-rail.tsx`: `holidays` prop 추가 + "월 보기 →" `<Link href="/leave/calendar">` 실제 링크로 교체
- `home/page.tsx`: `listCompanyHolidays` 병렬 fetch 추가 + `SendToColleagueButton` 교체 + holidays HomeRail 전달
- 헤더 버튼: `CreateAnnouncementButton` → `SendToColleagueButton` (공지 작성은 모달 2단계로 통합)

⚠️ 타입체크 통과 (기존 pre-existing 에러만). 런타임 미검증.

### 2026-05-29 — 홈 페이지 기능 보강 + 디자인 갭 분석

**디자인 갭 분석**
- 디자인 전사 파일(teamlet-full-transcription.md) 기반 30개 화면 전수 조사
- 실제 코드 확인: 미구현 12개, 부분 구현 3개, 구현 완료 15개 우선순위 확정
- 개발 순서: 홈 → 구성원 상세 → 워크플로우 → 설정 보안/알림

**홈 페이지 기능 보강**
- `packages/modules/src/employee/index.ts`: `listHomeEvents` (생일·입사기념일·신규합류 쿼리) + `countActiveEmployees` 추가
- `home/page.tsx`: 새 데이터 병렬 fetch (events, activeCount), 헤더에 팀 현황(출근/휴가 수) 표시, 휴가 신청 버튼 추가
- `feed-tab.tsx`: 이벤트 카드 컴포넌트 (EventCard — birthday/new_join/join_anniversary 3종), KPI 4장 디자인 기준 정렬
- `home-rail.tsx`: 오늘의 팀 현황 위젯 (연차 잔여 대체), 축하 보낼 동료 위젯 추가
- `design.css`: `.event-card`, `.btn-sm`, `.feed-actions` 클래스 추가

⚠️ 타입체크 통과 (기존 pre-existing 에러만). 런타임 미검증.

### 2026-05-28 — 디자인 시스템 전면 교체 (`teamlet_design/` 기반)

**설계**
- `teamlet_design/` 폴더의 JSX/HTML 프로토타입을 기준으로 전체 UI 교체
- 디자인 토큰: `--bg-primary/secondary/tertiary`, `--fg/fg-muted/fg-subtle`, `--border/border-strong`, `--primary`, `--destructive` 등
- 뱃지 패턴: `border + rounded + font-mono + 색상별 조합` 통일

**페이지별 교체 내용**
- **홈**: `grid-cols-[1fr_340px]` 레이아웃 + `HomeRail` + 히어로 인사말(wave 애니메이션) + KPI 카드 + `PostCard` (공지사항 피드) + `WelcomeTabs`
- **구성원**: KPI 카드 3개(재직/이번달입사/휴직) + 리스트↔조직도 뷰 토글 + `MembersFilterBar` + 체크박스·아바타·상태 배지 테이블 + 하단 카운트 바
- **워크플로우**: `DocKindBadge` + `WaitBadge(D+n/오늘)` + `StepLine` + `SectionDivider` + 3탭(결재대기/내가요청한/완료·참조) + `PendingDocCard/MyDocCard/DoneDocCard/CcCard`
- **개인 휴가**: `linear-gradient` 히어로 카드(연차 잔여 52px) + 분석 바(사용/잔여) + 타입 카드 그리드(3열) + 탭 레이블 "휴가 개요/신청 이력"
- **HR 휴가 관리**: `grid-cols-[1fr_360px]` 2열 레이아웃 + KPI 4개(전사평균/소진임박/이번달사용/오늘휴가중) + 테이블 + 상세 패널 + 미적용 타입 점선 배지
- **어드민 콘솔**: zinc 전체 제거 → 디자인 토큰

**설정 섹션**
- `settings-nav.tsx`: 회사 그룹 ADMIN 배지 추가
- `profile/page.tsx`: 그라디언트 아바타 카드 + `set-card` 구조
- `profile-form.tsx`: 220px 레이블 + 컨텐츠 2열 필드 레이아웃
- `company-info-form.tsx`: 로고 업로드 카드 + 읽기전용 카드 + set-card + 2열 필드
- `holidays-client.tsx`: 4열 그리드(날짜·이름·타입배지·버튼) + 법정(destructive)/회사(purple) 배지
- 운영 6페이지(`permissions/leave-policies/leave-types/approval-policies/form-templates/join-requests`): set-card 패턴 + h3 + 설명 추가

**컴포넌트 57개**: 디자인 토큰 전면 교체 완료 (zinc/slate → foreground/background/border)

⚠️ 타입체크 통과. 런타임 미검증 (Docker dev 서버 재기동 필요).

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
