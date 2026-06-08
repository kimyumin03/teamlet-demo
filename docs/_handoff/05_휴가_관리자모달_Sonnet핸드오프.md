# 휴가 #5·#6 — Sonnet 구현 핸드오프

> 작성: 2026-06-08 (Opus 선작업). **Sonnet은 이 문서만 보고 깊게 구현 가능.**
> SSOT = `docs/_transcribe/teamlet.md`([#6]) · `docs/_transcribe/flexv2.md §M`([#5]). **문구·선택지는 verbatim 복제, 의역 금지.**
> 디자인 = `teamlet-design.css` 토큰만. Flex 초록 버튼 → **Cool Blue/Slate 변주**(원본 초록 그대로 쓰지 말 것).

---

## 0. 작업 전 반드시 읽을 파일 (재탐색 금지 — 이미 검증됨)

| 목적 | 파일 |
|---|---|
| 관리자 휴가관리 화면(2열) | `apps/web/src/app/(app)/hr/leave/_components/leave-status-view.tsx` |
| 관리자 페이지 RSC | `apps/web/src/app/(app)/hr/leave/page.tsx` |
| 부여/조정/내역 버튼(기존) | `apps/web/src/components/hr/{grant-leave-button,adjust-leave-button,grant-history-button}.tsx` |
| 서버 함수 | `packages/modules/src/leave/balance.ts` — `grantLeave`(L84)·`adjustLeave`(L328)·`listLeaveGrantHistory`(L378) |
| 맞춤휴가 폼(#5 대상) | `apps/web/src/app/(settings)/settings/leave-types/_components/leave-types-client.tsx` |
| 공통 피커 | `apps/web/src/components/common/recipient-picker.tsx` (Anti-Pattern #10 — 신규 피커 만들지 말 것) |

## 0-1. 절대 지킬 가드 (`CLAUDE.md` Anti-Patterns)

- **#11 벌크 우회 금지**: 엑셀 일괄 부여 / 사용내역 업로드는 **반드시 `BulkOperation`+`BulkOperationRow` 경유**. `prisma.*.createMany()` 직접 호출 금지.
- **#3 권한**: 모든 신규 mutation 진입점에 `await assertPermission(user, 'leave.balance.manage' 등, { companyId })`.
- **#7 멀티테넌시**: 모든 쿼리 `companyId` 필터.
- **#8 Audit**: 부여/조정/회수/업로드 mutation은 `auditLog.record()`.
- **#2 정책 하드코딩 금지** / **#5 그라데이션·임의컬러 금지**(destructive는 `destructive-600/-50` 스케일 — bare `text-destructive` 무효, 메모리 `destructive-token-gotcha` 참조).
- **파일 = Route Handler**: 엑셀 다운로드/업로드는 Server Action 아닌 **Route Handler**(`app/api/...`). `CLAUDE.md` 컨벤션.

---

## 1. Opus 결정사항 (그대로 따를 것 — 재결정 불필요)

1. **엑셀 라이브러리 = `exceljs`** (apps/web에 설치 완료). SheetJS(`xlsx`)는 CVE·CDN 배포 이슈로 배제. 스타일 양식 생성 + 업로드 파싱 모두 exceljs로.
2. **다운로드 경로** = Route Handler `app/api/hr/leave/export/grants/route.ts` 등. exceljs `workbook.xlsx.writeBuffer()` → `Response`에 `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` + `Content-Disposition: attachment`.
3. **업로드 경로** = Route Handler POST `app/api/hr/leave/import/usage/route.ts` (multipart) → exceljs 파싱 → **`BulkOperation` 생성 후 행별 검증/적용**. 결과(성공/실패 행)를 BulkOperationRow에 기록.
4. **데이터 조회 = 모듈, 포맷팅 = 라우트**. 행 데이터는 `packages/modules/src/leave`에 함수 추가(예: `listGrantsForExport`)로 뽑고, exceljs 포맷은 라우트에서.
5. **회수(↩)** = 기존 `adjustLeave`의 차감으로 구현하되 사유 `RECALL` 태깅. 신규 소멸 로직 만들지 말 것.

---

## 2. 구현 범위 & 순서 (우선순위)

### #6 관리자 모달 (메인 — 깊은 작업)

**현재 상태**: [05] 맞춤휴가 부여 모달 = `grant-leave-button` ✅ / [04] 연차 조정(기본) = `adjust-leave-button` ✅ / 부여 내역 = `grant-history-button` 🟡(부분). **아래가 잔여.**

- **6a. 맞춤 휴가 부여 내역 화면** — `teamlet.md [12][22]`
  - 뷰 토글 `부여건별 | 대상자별` / 필터(부여기간·만료여부·휴가상태) / 표 컬럼 verbatim([12]=부여대상자·휴가종류·부여자·부여일시, [22]=☐·대상자·종류·사용가능기간·상태·부여·사용·잔여·부여자)
  - 일괄 변경 ▾([22]): `사용 기간 변경` / `회수`(잔여 있는 것만). 부여건별에서는 툴팁 `일괄 변경은 대상자별 내역에서만 가능해요.`([21])
- **6b. 엑셀 다운로드 모달** — `teamlet.md [14]~[20]`
  - 필드 순서 verbatim: 부여기간 → 부여자 → 부여대상자 → 휴가종류(멀티셀렉트 18종) → 휴가상태(미사용/부분/모두) → 만료여부(만료됨/안됨) → `부여 내역 다운로드`
  - exceljs export Route Handler. 대상자/부여자 피커는 RecipientPicker 재사용.
- **6c. 연차 사용 내역 업로드** — `teamlet.md [24][25][26]`
  - [24] 월별 연차 사용내역 탭(이름·사번·입사일·잔여·1~12월) + `연차 사용 내역 업로드` 버튼
  - [25] 모달: 1) 단위 토글(`일·시간·분` | `소수점`) → 양식 다운로드 / 2) 파일 드롭존 → `기록 업로드하기`. 부제·문구 verbatim
  - 업로드 = `BulkOperation` 경유(#11). 양식 다운로드 = exceljs 템플릿(단위 토글이 「사용 시간」 컬럼 단위 결정).
- **6d. 연차 조정 ▾ 드롭다운 확장** — `teamlet.md [04]`
  - 현재 단일 조정 → 메뉴화: 「조정」(연차 조정 / 재직자 정산용 / 퇴직자 정산용) + 「조정 내역」(연차 조정 내역 / 재직·퇴직자 잔여 조정 내역). 문구 verbatim.

### #5 맞춤휴가 동적폼 잔여 (소품 — 빠르게)

`leave-types-client.tsx`는 ~90% 완성. **남은 갭 = 반복부여(PERIODIC) 주기 옵션 빈약** — `flexv2.md §M #84~88`:
- 현재 `PERIODIC_CYCLE_OPTS` 평면 4개 → **매년**(입사연도·2·3·4·5년차 + 안내 `1월 1일 부여, 12월 31일 소멸`) / **매월**(입사월·2~11개월차 + 안내 `매월 1일 부여, 말일 소멸`)로 확장.
- 근속시부여([#88]) `입사일 기준` 토글 추가(선택).
- `periodicCycle`은 string 필드 → 값 확장만, 스키마 변경 불필요. 단 값 늘리면 `auto-grant.ts`/`promotion-engine.ts` 해석부도 확인할 것.

---

## 3. 스키마 영향 — Opus 확정 (⚠️ 지뢰 2건, 그냥 시작하면 막힘)

Opus가 `packages/db/prisma/schema.prisma` 직접 확인. **둘 다 모델이 없어서 신규 생성 필요**:

1. **`BulkOperation` / `BulkOperationRow` 모델 부재** (schema.prisma L1443에 "미구현" 주석으로만 존재).
   - Anti-Pattern #11이 요구하는 벌크 경유 인프라가 **아직 없음** → 엑셀 일괄 부여·사용내역 업로드(6b·6c) 착수 전 **두 모델부터 생성**해야 함.
   - 최소 스펙: `BulkOperation{ id, companyId, type(enum), status, actorId, totalRows, successRows, failedRows, createdAt }` + `BulkOperationRow{ id, operationId, rowIndex, rawData(Json), status, error? }`. enum `BulkOperationType`에 `LEAVE_USAGE_IMPORT`·`LEAVE_GRANT_IMPORT`.
   - **CSV 구성원 등록(`bulkCreateEmployees`)도 현재 이 인프라 없이 도는지** 함께 확인 — 있으면 패턴 재사용, 없으면 이번에 공용으로 세움.
2. **`LeaveTransaction`에 부여건 "사용 가능 기간" 필드 부재** (현 필드: occurredAt·category·txType·days·reason·note·actorId·leaveRequestId만).
   - 맞춤휴가 부여 [09][10][11]의 `사용 가능 기간`(언제든/시작·만료일 지정)과 [22]의 `사용 가능 기간` 컬럼·`사용 기간 변경`을 저장할 곳이 없음.
   - 조치: `LeaveTransaction`(또는 부여건 전용 모델)에 `usableFrom DateTime? @db.Date` / `usableUntil DateTime? @db.Date` 추가. GRANT 트랜잭션에만 사용.

> 적용은 **`pnpm db:push`** (dev 관행 — 마이그레이션 파일 X). 적용 후 Kysely 타입 재생성 필요하면 함께.
> **순서 주의**: 6b·6c는 위 스키마 선행. **#5 → 6a(스키마 무관) → [스키마 push] → 6b·6c·6d** 권장.

## 4. 완료 기준 (acceptance)

- [ ] web + modules **타입체크 통과**(`pnpm -F ./apps/web typecheck` / modules).
- [ ] 엑셀 다운로드 라우트가 실제 .xlsx 버퍼 반환(헤더 포함).
- [ ] 업로드가 BulkOperation 경유 + 실패 행 리포트.
- [ ] 모든 신규 mutation에 `assertPermission` + `auditLog`.
- [ ] 문구가 `teamlet.md`/`flexv2.md` verbatim과 일치.
- [ ] 디자인 토큰만(초록 직접 사용·그라데이션 0).
- [ ] 런타임은 별도 — dev 서버에서 검증(이 핸드오프 범위 밖, README 6/8 스크럼 항목).

## 5. 추천 진행 순서

`#5(워밍업) → 6a(스키마 무관) → [§3 스키마 2건 db push] → 6b → 6c → 6d`. 각 단계 타입체크 후 커밋(`feat(hr): ...`). 6b/6c는 exceljs Route Handler + BulkOperation이 핵심.
