# 진행 상황

> 세션 시작 시 이 파일을 먼저 읽고, 작업이 끝나면 **다음에 할 일** 섹션을 업데이트하세요.
> 상세 스펙은 `CLAUDE.md` + `/docs` 참조.

## 전체 진행도 (2026-05-21 기준)

| 영역 | 상태 | 비고 |
|---|---|---|
| 명세서 `/docs` | ✅ 100% | 00~06 7종, 6,050 lines |
| DB 스키마 + 시드 | ✅ P1+P2+P3+P4 일부 | 마이그레이션 4개 + P4 스키마 추가 (migrate 필요) |
| Shared 패키지 | ✅ 골격 | errors, schemas, types, utils |
| UI 시스템 | 🟡 기초만 | theme + primitives 3 / patterns 3 (Checkbox/Tabs/Card 미구현) |
| **P1 인증/가입** | ✅ 완료 | auth 모듈 + 화면 5개 + NextAuth + 데모 자가-승인 |
| **P1 권한** | ✅ 핵심 완료 | 평가/CRUD/매핑/UserRole/락아웃/부트스트랩 ✓ — 권한 편집 UI만 잔여 |
| **P2 Core HR (구성원/조직/직책)** | ✅ 7단계 완료 | 디렉토리/검색/부서/상세/수정/퇴직/직책 |
| **P3 휴가** | ✅ UI 완료 | /leave + 신청/취소 + 관리자 승인/반려 + 수동 부여 ✓ |
| Worker | ⬜ 빈 skeleton | BullMQ 미구현 |
| **P4 워크플로우** | 🟡 MVP 완료 | DB스키마 + 모듈 + /workflow UI (문서작성/승인/반려) ✓ — 마이그레이션 미적용 |
| P5~P8 | ⬜ 미착수 | 채용/문서/보안/확장 |

## 현재 위치

- **Phase**: P4 워크플로우 MVP 완료, **다음은 DB migrate 후 테스트 또는 P5~**
- **브랜치**: `main`
- **원격**: `https://github.com/kimyumin03/Teamlet.git`
- **마지막 커밋**: `7866497 feat(workflow): P4 2~3단계 — 워크플로우 모듈 + /workflow UI`
- **⚠️ P4 migrate 필요**: `pnpm db:migrate` 실행해야 workflow 테이블 생성됨

## 다음 작업

### P4 워크플로우 잔여 (선택)
- FormTemplate 관리 UI (`/workflow/templates`)
- 문서 상세 페이지 (`/workflow/documents/[id]`) — 결재 이력 + 현재 단계

### P2 잔여 폴리시 (선택)
- 부서 이동 (parentId + 순환 가드)
- PositionHistory 시점 이력
- 직원 복직 처리

### P4 워크플로우 (다음 Phase)

## 최근 한 일

### P3 휴가 UI (2026-05-21 이번 세션)
- `3d51dd5` P3 4단계 — 수동 부여 Dialog (GrantLeaveButton)
- `d6f8758` P3 3단계 — 관리자 승인/반려 뷰 (/leave/requests)
- `770b293` P3 2단계 — /leave 페이지 + 신청 Dialog + 취소 버튼

### P3 휴가 도메인 — DB + 모듈 (2026-05-20)
- `90730fe` P3 1단계 — CompanyHoliday·LeaveTransaction 스키마 + leave 모듈 (bootstrap/balance/request) + Server Actions

### P2 Core HR (이전 세션)
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

- **UI 디자인 폴리시**: 기능 검증 완료 후 Flex 스타일로 디자인 다듬기 (기능 구현 우선, 디자인은 후순위)

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
