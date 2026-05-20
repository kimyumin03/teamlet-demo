# 진행 상황

> 세션 시작 시 이 파일을 먼저 읽고, 작업이 끝나면 **다음에 할 일** 섹션을 업데이트하세요.
> 상세 스펙은 `CLAUDE.md` + `/docs` 참조.

## 전체 진행도 (2026-05-20 기준)

| 영역 | 상태 | 비고 |
|---|---|---|
| 명세서 `/docs` | ✅ 100% | 00~06 7종, 6,050 lines |
| DB 스키마 + 시드 | ✅ P1+P2 일부 | 마이그레이션 3개 (`0_init` / `1_employee_department` / `2_position_model`) |
| Shared 패키지 | ✅ 골격 | errors, schemas, types, utils |
| UI 시스템 | 🟡 기초만 | theme + primitives 3 / patterns 3 (Checkbox/Tabs/Card 미구현) |
| **P1 인증/가입** | ✅ 완료 | auth 모듈 + 화면 5개 + NextAuth + 데모 자가-승인 |
| **P1 권한** | ✅ 핵심 완료 | 평가/CRUD/매핑/UserRole/락아웃/부트스트랩 ✓ — 권한 편집 UI만 P2 잔여 |
| **P2 Core HR (구성원/조직/직책)** | ✅ 7단계 완료 | 디렉토리/검색/부서/상세/수정/퇴직/직책 (PositionHistory + 부서 이동은 P3) |
| Worker | ⬜ 빈 skeleton | BullMQ 미구현 |
| P3~P8 | ⬜ 미착수 | 휴가/워크플로우/채용/문서/보안/확장 |

## 현재 위치

- **Phase**: P2 Core HR 7단계까지 완료 → **로컬 페이지 확인 단계**
- **브랜치**: `main`
- **원격**: `https://github.com/kimyumin03/Teamlet.git`
- **마지막 커밋**: `e7c8a3a feat(position): P2 7단계 — Position 모델 + 직원 직책 배정`

## 다음 세션 시작 — 로컬 확인 셋업

**Docker Desktop 미시작 + `.env` 파일 부재 상태**. 다음 세션에서 이걸 먼저 해결하고 페이지 확인 진행.

### 1단계: Docker Desktop 시작 (Windows)

작업표시줄에서 Docker Desktop 앱 켜기. 안정 상태(고래 아이콘이 정적)까지 1~2분 대기.

WSL2 미설치 시: Windows 기능 → "Windows Subsystem for Linux" + "Virtual Machine Platform" 활성화 후 재부팅.

### 2단계: `.env` 파일 생성 (PowerShell, `D:\teamlet`에서)

```powershell
Copy-Item .env.example .env

# AUTH_SECRET 생성 (32바이트 base64)
$bytes = New-Object byte[] 32
(New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

`.env` 파일 편집:
- `AUTH_SECRET="..."` 자리에 출력된 base64 붙여넣기
- 맨 아래 한 줄 추가: `TEAMLET_DEMO_AUTO_APPROVE="true"`

### 3단계: DB + Dev 서버

```powershell
pnpm docker:up           # Postgres + Redis + MinIO (~30초)
pnpm db:generate         # Prisma client
pnpm db:migrate          # 0_init + 1_employee_department + 2_position_model
pnpm db:seed             # 권한 카탈로그
pnpm dev                 # http://localhost:3000
```

### 페이지 확인 체크리스트

- [ ] `/signup` 가입 → 자동 로그인 → `/join-company`
- [ ] "회사 등록 신청" → 자가-승인 → `/home`
- [ ] `/members` 진입 → 본인 1명 (시스템 역할 자동 부여 확인)
- [ ] `+ 직책` (사원/팀장) → `+ 부서` (영업팀) → `+ 구성원` (부서/직책 선택)
- [ ] 사이드바 부서 클릭 → URL `?department=` 필터링
- [ ] 검색창 "김" → 디바운스 후 필터
- [ ] 직원 상세 → "수정" → "퇴직 처리" (목록으로 복귀)
- [ ] `/settings/permissions` → 시스템 역할 3종 확인

## 최근 한 일

### P2 Core HR (이번 세션)
- `e7c8a3a` P2 7단계 — Position 모델 + 직원 직책 배정 (UI 통합)
- `1297d6f` P2 6단계 — 부서 이름 변경 + 삭제(soft)
- `bef08b7` P2 5-C — 직원 비활성화 (퇴직 처리, 락아웃 가드 적용)
- `9c541e9` P2 5-B — 직원 정보 수정 (Dialog 폼)
- `073b544` P2 5-A — 직원 상세 페이지 `/members/[id]`
- `2062fd0` P2 4단계 — 검색창 (디바운스 + URL `?q=`)
- `28cfa07` P2 3-C — 부서 추가 + 직원 폼 부서 select
- `4319c72` P2 3-B — 부서 사이드바 + URL 필터링
- `5c2fc4f` P2 3-A — Employee.departmentId + Department 모듈 + 마이그레이션 `1_employee_department`
- `67f0edd` P2 2단계 — 구성원 추가 흐름
- `9b21ca8` P2 진입 — 구성원 디렉토리 read `/members`
- `58f4351` `_actor.ts` 헬퍼 추출 (role/mapping/userrole 3중복 해소)

### P1 권한 + 자가-승인 (직전 세션)
- `23d35de` UserRole 배정/해제 + 락아웃 가드 호출처
- `6c24aef` 데모 자가-승인 + jwt stale 회복
- `ee2b332` `approveCompanyApplication` 트랜잭션
- `1f0248f` 락아웃 방지 가드 (`assertNotLastSuperAdmin`)
- `4bdd160` `bootstrapCompanyRoles` (시스템 역할 3종 + SUPER_ADMIN 권한)
- `9d0476b` `/settings/permissions` MVP 페이지
- `1b25136` 역할-권한 매핑 + Scope 편집
- `56e308a` 역할 CRUD + 시스템 역할 보호
- `12c11e9` 권한 카탈로그 조회

## 페이지 확인 후 다음 자연스러운 단계

페이지 확인하면서 발견된 버그/UX 우선 처리. 그 후 로드맵 순서:

- **P2 잔여 폴리시** (확인 결과 보고 결정)
  - 부서 이동(parentId 변경 + 순환 가드)
  - PositionHistory 시점 이력
  - 권한 매핑 편집 UI (UI primitive Checkbox/Tabs 보강 필요)
  - 직원 복직 처리
- **P3 휴가** 진입 — LeaveType / LeaveBalance / LeaveRequest 도메인 + 신청·승인 흐름. 공휴일/법정휴가 시드는 데이터로 이미 정의 (적용 안 됨)

## 알려진 이슈 / 메모

- **Docker Desktop 미설치/미시작 시**: 마이그레이션·DB 작업 전부 막힘. WSL2 활성화 필요.
- **`.env` 파일 부재**: 루트에 `.env.example`만 있음. 위 셋업 가이드 따라 복사 + AUTH_SECRET + TEAMLET_DEMO_AUTO_APPROVE 설정 필요.
- 빌드는 **Turbopack 전용** (webpack prod 빌드는 Docker Desktop 소켓 EACCES 이슈)
- 워크스페이스 상대 import 는 **확장자 없이** (`.js` 금지)
- 권한 키 컨벤션: `<category>.<domain>.<action>` (예: `member.directory.read`)
- `UserRole`은 `employeeId` 기준 (User가 아님 — 회사별 신분)
- **Windows 터미널**: `cmd` 기본 CP949에서 한글/이모지 잘림으로 Claude Code 대화에 lone surrogate 박힐 수 있음 → `API Error 400: no low surrogate` 로 세션 꼬임. **PowerShell 또는 `chcp 65001` 후 cmd 사용 권장**. 한 번 꼬이면 그 세션은 복구 불가, `claude` 재실행 필요.
- **데모 모드 환경변수**: `TEAMLET_DEMO_AUTO_APPROVE=true` 일 때만 회사 신청 자동 승인. 운영 환경에 절대 켜지 말 것 (악용 가능).
- **jwt callback stale 회복**: 멤버십 미확정 사용자만 매 요청 시 DB 1회 추가 조회 — 일반 사용자는 영향 없음.
- **DYNAMIC_ORG_HEAD 평가 미통합**: `Position.isOrgHead`는 데이터로만 존재. 권한 평가 모듈은 아직 사용 안 함.

## 자주 쓰는 명령

```powershell
pnpm docker:up           # Postgres + Redis + MinIO
pnpm db:generate         # schema 변경 후 (DB 연결 불필요)
pnpm db:migrate          # 마이그레이션 적용 (DB 필요)
pnpm db:seed             # 권한 카탈로그 시드
pnpm dev                 # web + worker (http://localhost:3000)
pnpm docker:down         # 컨테이너 종료
```
