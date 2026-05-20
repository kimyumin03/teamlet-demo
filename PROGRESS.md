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
| **P1 권한** | 🟡 60% | DB + 시드 + 모듈 ✓, **UI 미착수** ← 현재 작업 |
| Worker | ⬜ 빈 skeleton | BullMQ 미구현 |
| P2~P8 | ⬜ 미착수 | 직원/조직/휴가/워크플로우/채용/문서/보안/확장 |

## 현재 위치

- **Phase**: P1 Foundation (인증/가입/권한)
- **브랜치**: `main`
- **원격**: `https://github.com/kimyumin03/Teamlet.git` (로컬 = origin, 푸시 보류 없음)
- **마지막 커밋**: `4909f4f feat(permission): RBAC + Scope 평가 모듈 (ALL/SELF, P1 범위)`

## 최근 한 일

- `4909f4f` 권한 모듈 신설 — `assertPermission` / `hasPermission` / `getEffectivePermissions`, ALL/SELF 실구현, DEPT/DIRECT는 P2 stub
- `8fdcc5b` Phase 1 인증 화면 (로그인/회원가입/회사가입)

## 다음에 할 일

**현재 작업: 권한 설정 UI (Flex 11-1, docs/02 §11-1)**

권한 모듈은 모델·평가 끝. 이제 회사 관리자가 역할/권한을 편집할 수 있는 UI 필요.

체크리스트:
- [ ] 권한 카테고리 14개 + 권한 카탈로그 (시드 데이터) 조회 Server Action
- [ ] 역할 CRUD Server Action (`createRole` / `updateRole` / `deleteRole`) — assertPermission 가드 적용
- [ ] 역할-권한 매핑 + Scope 편집 Server Action
- [ ] `/settings/permissions` 페이지 — 역할 리스트 + 편집 (2-column 패턴)
- [ ] 권한 그룹 카드 (Flex 패턴, 그라데이션 X)
- [ ] 락아웃 방지 안전장치 (docs/02 §13-16) — 마지막 SYSTEM_SUPER_ADMIN 박탈 차단
- [ ] (선택) vitest 인프라 셋업 + scope 단위 테스트

### 보류 항목 (P2 이후)

- DEPARTMENT / DIRECT_REPORTS Scope 실구현 — Employee 부서/manager 관계 도입 후
- DYNAMIC_ORG_HEAD 동적 역할 평가
- `EffectivePermission` 캐시 테이블 + read-through

## 알려진 이슈 / 메모

- 빌드는 **Turbopack 전용** (webpack prod 빌드는 Docker Desktop 소켓 EACCES 이슈)
- 워크스페이스 상대 import 는 **확장자 없이** (`.js` 금지)
- 권한 키 컨벤션: `<category>.<domain>.<action>` (예: `employee.profile.read`)
- `UserRole`은 `employeeId` 기준 (User가 아님 — 회사별 신분)

## 자주 쓰는 명령

```
pnpm docker:up        # Postgres + Redis + MinIO
pnpm db:migrate
pnpm dev              # web + worker
```
