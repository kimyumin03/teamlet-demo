# 진행 상황

> 세션 시작 시 이 파일을 먼저 읽고, 작업이 끝나면 **다음에 할 일** 섹션을 업데이트하세요.
> 상세 스펙은 `CLAUDE.md` + `/docs` 참조.

## 전체 진행도 (2026-05-20 기준)

| 영역 | 상태 | 비고 |
|---|---|---|
| 명세서 `/docs` | ✅ 100% | 00~06 7종, 6,050 lines |
| DB 스키마 + 시드 | ✅ P1 완료 | `0_init` 마이그레이션, 권한/공휴일/법정휴가 시드 |
| Shared 패키지 | ✅ 골격 | errors, schemas, types, utils |
| UI 시스템 | 🟡 기초만 | theme + primitives 3 / patterns 3 (11개 핵심 중 8개 미구현) |
| **P1 인증/가입** | ✅ 완료 | auth 모듈 + 화면 5개 + NextAuth |
| **P1 권한** | ✅ 핵심 완료 | 평가/CRUD/매핑/UserRole/락아웃/부트스트랩 자가-승인 ✓ — 권한 편집 UI만 P2 |
| Worker | ⬜ 빈 skeleton | BullMQ 미구현 |
| P2~P8 | ⬜ 미착수 | 직원/조직/휴가/워크플로우/채용/문서/보안/확장 |

## 현재 위치

- **Phase**: P1 Foundation (인증/가입/권한)
- **브랜치**: `main`
- **원격**: `https://github.com/kimyumin03/Teamlet.git` (로컬 = origin, 푸시 보류 없음)
- **마지막 커밋**: `23d35de feat(permission): UserRole 배정/해제 + 락아웃 가드 호출처 마련`

## 최근 한 일

- `23d35de` UserRole 배정/해제 — `assignRole`/`revokeRole` (`assertNotLastSuperAdmin` 호출처 마련, soft delete + 재활성화 패턴)
- `6c24aef` 데모 자가-승인 — `submitCompanyApplication` 에 `TEAMLET_DEMO_AUTO_APPROVE` 분기, jwt callback 에서 stale `employeeId` 자동 회복
- `ee2b332` `approveCompanyApplication` — Company/Employee/Membership/Application.APPROVED 단일 트랜잭션 + `bootstrapCompanyRoles` + SUPER_ADMIN 부여
- `1f0248f` 락아웃 방지 — `countActiveSuperAdmins` / `assertNotLastSuperAdmin`
- `4bdd160` `bootstrapCompanyRoles` — 회사별 시스템 역할 3종 upsert + SUPER_ADMIN 전권한 매핑
- `9d0476b` `/settings/permissions` MVP 페이지 — 역할 리스트 + 생성 Dialog + 삭제
- `1b25136` 역할-권한 매핑 + Scope 편집 Server Action — "전체 교체" 패턴
- `56e308a` 역할 CRUD Server Action — `permission.role.manage` 가드, cross-tenant 은닉, 시스템 역할 보호
- `12c11e9` 권한 카탈로그 조회 Server Action
- `a6b4ef5` Session 에 `currentCompanyId` / `employeeId` 노출
- `4909f4f` 권한 모듈 신설 — `assertPermission` / `hasPermission` / `getEffectivePermissions`

## 다음에 할 일

**P1 권한 핵심 완료.** `TEAMLET_DEMO_AUTO_APPROVE=true` 설정 시 회사 신청 → 즉시 활성화 → `/settings/permissions` 진입 가능. 남은 건 UI 보강 + 작은 리팩터.

> **다음 세션 시작점: `_actor.ts` 헬퍼 추출** (체크리스트 두 번째 미체크 항목).

체크리스트:
- [x] 권한 카탈로그 조회 Server Action (`12c11e9`)
- [x] 역할 CRUD Server Action (`56e308a`)
- [x] 역할-권한 매핑 + Scope 편집 Server Action (`1b25136`)
- [x] `/settings/permissions` 페이지 — MVP (역할 리스트 + 생성/삭제) (`9d0476b`)
- [x] 락아웃 방지 가드 함수 (`1f0248f`)
- [x] `bootstrapCompanyRoles` (`4bdd160`) + 자가-승인 흐름 호출처 (`ee2b332` / `6c24aef`)
- [x] UserRole CRUD + `assertNotLastSuperAdmin` 호출처 (`23d35de`)
- [ ] **권한 매핑 편집 UI** (2-column, 카테고리 탭 + 체크박스 + 검색) — UI primitive Checkbox/Tabs/Card 보강 필요
- [ ] **`_actor.ts` 헬퍼 추출** — `loadActor`/`catchDomainErr` 가 role/mapping/userrole 3개 파일 중복. 작은 리팩터로 묶기 적기
- [ ] (선택) vitest 인프라 셋업 + scope/lockout 단위 테스트

### 보류 항목 (P2 이후)

- DEPARTMENT / DIRECT_REPORTS Scope 실구현 — Employee 부서/manager 관계 도입 후
- DYNAMIC_ORG_HEAD 동적 역할 평가
- `EffectivePermission` 캐시 테이블 + read-through
- Sales-led admin 도구 (PENDING 신청 수동 검토 UI) — 현재는 데모 자가-승인만

## 알려진 이슈 / 메모

- 빌드는 **Turbopack 전용** (webpack prod 빌드는 Docker Desktop 소켓 EACCES 이슈)
- 워크스페이스 상대 import 는 **확장자 없이** (`.js` 금지)
- 권한 키 컨벤션: `<category>.<domain>.<action>` (예: `employee.profile.read`)
- `UserRole`은 `employeeId` 기준 (User가 아님 — 회사별 신분)
- **Windows 터미널**: `cmd` 기본 CP949에서 한글/이모지 잘림으로 Claude Code 대화에 lone surrogate 박힐 수 있음 → `API Error 400: no low surrogate` 로 세션 꼬임. **PowerShell 또는 `chcp 65001` 후 cmd 사용 권장**. 한 번 꼬이면 그 세션은 복구 불가, `claude` 재실행 필요.
- **권한 모듈 헬퍼 중복 (확대됨)**: `role.ts` / `mapping.ts` / `userrole.ts` 3개 파일에서 `loadActor` / `catchDomainErr` 동일 코드 반복. 다음 작업 후보로 `_actor.ts` 추출 권장 (작은 리팩터).
- **데모 모드 환경변수**: `TEAMLET_DEMO_AUTO_APPROVE=true` 일 때만 회사 신청 자동 승인. 운영 환경에 절대 켜지 말 것 (악용 가능). 별도 admin 도구는 P2.
- **jwt callback stale 회복**: 멤버십 미확정 사용자만 매 요청 시 DB 1회 추가 조회 — 일반 사용자는 영향 없음.

## 자주 쓰는 명령

```
pnpm docker:up        # Postgres + Redis + MinIO
pnpm db:migrate
pnpm dev              # web + worker
```
