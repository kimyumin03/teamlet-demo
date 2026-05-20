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
| **P1 권한** | 🟢 95% | 평가/CRUD/매핑/페이지 MVP/락아웃 가드 ✓, bootstrap/lockout 호출처 미반영 |
| Worker | ⬜ 빈 skeleton | BullMQ 미구현 |
| P2~P8 | ⬜ 미착수 | 직원/조직/휴가/워크플로우/채용/문서/보안/확장 |

## 현재 위치

- **Phase**: P1 Foundation (인증/가입/권한)
- **브랜치**: `main`
- **원격**: `https://github.com/kimyumin03/Teamlet.git` (로컬 = origin, 푸시 보류 없음)
- **마지막 커밋**: `1f0248f feat(permission): 락아웃 방지 가드 (마지막 SUPER_ADMIN 박탈 차단)`

## 최근 한 일

- `1f0248f` 락아웃 방지 — `countActiveSuperAdmins` / `assertNotLastSuperAdmin` (호출처는 UserRole CRUD/Employee 비활성화 PR 에서)
- `4bdd160` `bootstrapCompanyRoles` — 회사별 시스템 역할 3종(SUPER_ADMIN/ORG_HEAD/DEFAULT) upsert + SUPER_ADMIN 전권한 매핑 (호출처는 Sales-led 승인 흐름 PR)
- `9d0476b` `/settings/permissions` MVP 페이지 — 역할 리스트 + 생성 Dialog + 삭제 (시스템 역할 보호 UI)
- `1b25136` 역할-권한 매핑 + Scope 편집 Server Action — "전체 교체" 패턴, hasScope 일관성 검증
- `56e308a` 역할 CRUD Server Action — `permission.role.manage` 가드, cross-tenant 은닉, 시스템 역할 보호, audit
- `12c11e9` 권한 카탈로그 조회 Server Action — 카테고리(12) → 도메인 → read/manage 페어 그룹화
- `a6b4ef5` Session 에 `currentCompanyId` / `employeeId` 노출 — `resolveLoginContext` 추가
- `4909f4f` 권한 모듈 신설 — `assertPermission` / `hasPermission` / `getEffectivePermissions`, ALL/SELF 실구현

## 다음에 할 일

**P1 권한 잔여**: 비활성 헬퍼 호출처 연결이 마지막 빚. 이게 풀려야 `/settings/permissions` 실제 진입 가능.

체크리스트:
- [x] 권한 카탈로그 조회 Server Action (`12c11e9`)
- [x] 역할 CRUD Server Action (`56e308a`)
- [x] 역할-권한 매핑 + Scope 편집 Server Action (`1b25136`)
- [x] `/settings/permissions` 페이지 — MVP (역할 리스트 + 생성/삭제) (`9d0476b`)
- [x] 락아웃 방지 가드 함수 (`1f0248f`)
- [ ] (선택) vitest 인프라 셋업 + scope 단위 테스트
- [ ] **Sales-led 회사 승인 흐름** — CompanyApplication → Company.create + `bootstrapCompanyRoles(companyId)` 호출 + 신청자 Employee/Membership/SUPER_ADMIN UserRole 부여. 이게 없으면 누구도 `/settings/permissions` 진입 불가
- [ ] UserRole CRUD (배정/해제) + Employee 비활성화 흐름에 `assertNotLastSuperAdmin` 호출 — bootstrap 호출처 마련 후
- [ ] 권한 매핑 편집 UI (2-column, 카테고리 탭 + 체크박스 + 검색) — UI primitive Checkbox/Tabs/Card 보강 필요

### 보류 항목 (P2 이후)

- DEPARTMENT / DIRECT_REPORTS Scope 실구현 — Employee 부서/manager 관계 도입 후
- DYNAMIC_ORG_HEAD 동적 역할 평가
- `EffectivePermission` 캐시 테이블 + read-through
- `/settings/permissions` 페이지의 권한 편집 영역 (현재는 리스트 + 생성/삭제만)

## 알려진 이슈 / 메모

- 빌드는 **Turbopack 전용** (webpack prod 빌드는 Docker Desktop 소켓 EACCES 이슈)
- 워크스페이스 상대 import 는 **확장자 없이** (`.js` 금지)
- 권한 키 컨벤션: `<category>.<domain>.<action>` (예: `employee.profile.read`)
- `UserRole`은 `employeeId` 기준 (User가 아님 — 회사별 신분)
- **Windows 터미널**: `cmd` 기본 CP949에서 한글/이모지 잘림으로 Claude Code 대화에 lone surrogate 박힐 수 있음 → `API Error 400: no low surrogate` 로 세션 꼬임. **PowerShell 또는 `chcp 65001` 후 cmd 사용 권장**. 한 번 꼬이면 그 세션은 복구 불가, `claude` 재실행 필요.
- **권한 모듈의 dead code 2개** (의도된 상태):
  - `bootstrapCompanyRoles` — Sales-led 회사 승인 흐름 PR 에서 호출 예정
  - `countActiveSuperAdmins` / `assertNotLastSuperAdmin` — UserRole CRUD / Employee 비활성화 PR 에서 호출 예정
- **권한 모듈 중복**: `role.ts` 와 `mapping.ts` 가 `loadActor` / `catchDomainErr` 헬퍼 중복. UserRole CRUD 추가 시 `_actor.ts` 로 추출 권장.
- **`permission.role.read` 매핑 부재**: 어떤 역할에도 권한이 매핑돼 있지 않아 현재 코드 상태로 `/settings/permissions` 진입 불가. bootstrap 호출처 마련되면 자연 해소.

## 자주 쓰는 명령

```
pnpm docker:up        # Postgres + Redis + MinIO
pnpm db:migrate
pnpm dev              # web + worker
```
