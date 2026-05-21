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
| **P1 인증/가입** | ✅ 완료 + 강화 | auth 모듈 + 화면 5개 + NextAuth + 데모 자가-승인 + Google OAuth + 초대 링크 |
| **P1 권한** | ✅ 핵심 완료 | 평가/CRUD/매핑/UserRole/락아웃/부트스트랩 ✓ |
| **P2 Core HR (구성원/조직/직책)** | ✅ 완료 | 탭 상세 + 확장 필드 + 상태 탭 필터 + 고용형태 필터 + CSV 일괄 등록 |
| **P3 휴가** | ✅ UI 완료 | /leave + 신청/취소 + 관리자 승인/반려 + 수동 부여 + 팀 캘린더 ✓ |
| **P3 휴가 정책** | ✅ 완료 | LeavePolicy DB + CRUD + 배정 UI (`/settings/leave-policies`) |
| **P4 워크플로우** | ✅ MVP 완료 | /workflow + 3단계 위저드(양식→동적필드→결재선) + 문서 상세 ✓ |
| **P4 양식 빌더** | ✅ 완료 | FormTemplate CRUD + 필드 편집 UI (`/settings/form-templates`) |
| **P5 채용** | ✅ 강화 완료 | 공고 목록 + 상태 필터 + 후보자 목록/칸반 뷰 ✓ |
| **P6 문서·증명서** | ✅ MVP 완료 | /documents 보관소 + /documents/certificates 발급/인쇄 ✓ |
| **P7 보안** | ✅ 강화 완료 | 보안 정책 + 감사 로그 (유형/이벤트 필터 + 텍스트 검색) ✓ |
| **P8 알림** | ✅ 강화 완료 | 알림 벨 패널 + /notifications 전용 페이지 (탭/읽음 처리) ✓ |
| **회사 설정** | ✅ 완료 | 회사 정보 수정 + 공휴일 관리 |
| **개인 설정** | ✅ 완료 | /settings/profile — 프로필 수정 + 비밀번호 변경 |
| **⌘K 커맨드 팔레트** | ✅ 완료 | 구성원 검색 + 전체 페이지 네비게이션 |
| **홈 대시보드** | ✅ 완료 | 결재 대기 + 연차 잔여 + 최근 문서 + 알림 + 빠른 이동 |
| Worker | ⬜ 빈 skeleton | BullMQ 미구현 |

## 현재 위치

- **Phase**: P1~P8 + 설정/UX 확장 전반 완료
- **브랜치**: `main`
- **원격**: `https://github.com/kimyumin03/Teamlet.git`
- **마지막 커밋**: `459332d feat(recruit): 공고 상태 필터 + 후보자 칸반 뷰`
- **마이그레이션**: 12개 적용 (`0_init` ~ `12_google_oauth`, db push로 적용)

## 다음 작업 후보 (우선순위 순)

### 🔴 HIGH — 실사용 갭
1. ~~**이메일 초대**~~ ✅ — 초대 링크 생성 + `/invite/[token]` 수락 페이지 + callbackUrl 로그인/가입 연동
2. **구성원 상세 강화** — 휴가 잔여/이력 탭, 결재 내역 탭

### 🟡 MEDIUM — Flex 대비 격차
3. **Worker(BullMQ)** — 휴가 자동 부여, 비동기 알림
4. **실시간 알림** — SSE 또는 WebSocket
5. **Position.isOrgHead** 권한 평가 통합

### 🟢 LOW — 선택적 강화
6. 2FA 실제 TOTP 연동
7. CSV 내보내기 (구성원 다운로드)
8. 채용 후보자 상세 페이지 (이력서 첨부, 메모)
9. 모바일 반응형 UI 개선

## 최근 한 일 (2026-05-21 다음 세션)

### 이메일 초대 흐름
- `eb9ff5f` 직원 초대 링크 — `createEmployeeInvite` / `getInviteInfo` / `acceptEmployeeInvite` 모듈
- `/invite/[token]` 수락 페이지 (미로그인→로그인/가입 선택, 로그인→수락 버튼)
- `callbackUrl` 지원: login·signup page/action/form 연동
- `EmployeeDetail.hasLinkedAccount` + 구성원 상세 "초대 링크 생성" 버튼

## 최근 한 일 (2026-05-21 이번 세션)

### Google OAuth + 개인 설정 + 채용/알림/감사로그 강화
- `459332d` 채용 — 공고 상태 필터 탭 + 후보자 칸반 뷰 (목록/칸반 전환)
- `18d4bed` 알림 — /notifications 전용 페이지 (전체/안읽음 탭, 읽음 처리)
- `444d691` 감사 로그 — 활동유형·이벤트 필터 탭 + 텍스트 검색 추가
- `71cf489` 구성원 — CSV 일괄 가져오기 (템플릿 다운로드 + 행별 결과)
- `0a1fc6b` 휴가 — 팀 휴가 캘린더 월별 뷰 (/leave/calendar)
- `3407158` 인증 — Google OAuth 로그인 추가 (로그인/회원가입 버튼)
- `52638ab` 개인 설정 — /settings/profile (프로필 수정 + 비밀번호 변경) + Google OAuth 스키마
- `c4de068` 구성원 — 재직/퇴직 상태 탭 + 고용형태 드롭다운 필터

### 이전 세션 (2026-05-21 앞부분)
- 홈 대시보드 — 결재 대기 + 연차 잔여 + 최근 문서 + 알림 + 빠른 이동
- 워크플로우 3단계 위저드 — 양식 선택 → 동적 필드 → 결재선 지정

### 그 이전
- 양식 빌더, ⌘K 커맨드 팔레트, 회사 설정, 휴가 정책, 구성원 상세 탭 (P2 확장)
- P8 알림, P7 보안, P6 문서, P5 채용, P4 워크플로우, P3 휴가, P2 Core HR, P1 권한

## 알려진 미완/잔여

- Worker(BullMQ) 빈 skeleton — 비동기 처리 미구현
- `Position.isOrgHead` — DB 데이터만, 권한 평가 미통합
- 권한 편집 UI — Checkbox/Tabs primitive 미구현으로 단순 select로만 동작
- 채용 후보자 상세 페이지 없음 (이름/이메일 클릭 시 이동 없음)

## 알려진 이슈 / 메모

- **UI 디자인 폴리시**: 기능 검증 완료 후 Flex 스타일로 디자인 다듬기 (기능 구현 우선)
- **Docker Desktop 미설치/미시작 시**: 마이그레이션·DB 작업 전부 막힘. WSL2 활성화 필요.
- **Google OAuth**: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` `.env`에 설정됨. Google Cloud Console에서 리디렉션 URI 등록 필요 (`http://localhost:3000/api/auth/callback/google`)
- **`.env` 파일 부재**: 루트에 `.env.example`만 있음. AUTH_SECRET + TEAMLET_DEMO_AUTO_APPROVE 설정 필요.
- 빌드는 **Turbopack 전용** (webpack prod 빌드는 Docker Desktop 소켓 EACCES 이슈)
- 워크스페이스 상대 import는 **확장자 없이** (`.js` 금지)
- 권한 키 컨벤션: `<category>.<domain>.<action>` (예: `member.directory.read`)
- `UserRole`은 `employeeId` 기준 (User가 아님 — 회사별 신분)
- **Windows 터미널**: PowerShell 또는 `chcp 65001` 후 cmd 사용 권장 (CP949 한글/이모지 잘림 이슈)
- **데모 모드**: `TEAMLET_DEMO_AUTO_APPROVE=true` 운영 환경에 절대 켜지 말 것
- **prisma migrate dev**: 비대화형 환경에서 막힘 → `db push`로 대체 후 마이그레이션 파일 수동 관리

## 자주 쓰는 명령

```powershell
pnpm docker:up           # Postgres + Redis + MinIO
pnpm db:generate         # schema 변경 후 (DB 연결 불필요)
pnpm db:migrate          # 마이그레이션 적용 (DB 필요)
pnpm db:seed             # 권한 카탈로그 시드
pnpm dev                 # web + worker (http://localhost:3000)
pnpm docker:down         # 컨테이너 종료
```
