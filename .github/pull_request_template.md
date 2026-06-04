## 변경 요약

<!-- 무엇을, 왜 바꿨는지 2-4줄로. 배경·동기·제약 포함. -->

-
-

## 변경 유형

<!-- 해당하는 항목에 x 표시 -->

- [ ] `feat` — 새 기능
- [ ] `fix` — 버그 수정
- [ ] `refactor` — 동작 변경 없는 코드 정리
- [ ] `chore` — 빌드·설정·의존성
- [ ] `docs` — 문서만
- [ ] `test` — 테스트만

## 체크리스트

- [ ] `pnpm --filter web typecheck` 통과
- [ ] `pnpm --filter @teamlet/modules typecheck` 통과
- [ ] 새 DB 스키마가 있으면 `db push` + 마이그레이션 파일 생성
- [ ] Anti-Pattern 위반 없음 (CLAUDE.md §Anti-Patterns)
  - `any` 타입 미사용
  - `assertPermission` 누락 없음
  - `auditLog.record()` 누락 없음
  - `localStorage` 미사용
  - 그라디언트 / 임의 hex 컬러 미사용
- [ ] 런타임 검증 완료 또는 "런타임 미검증" 명시

## 스크린샷 / 재현 절차

<!-- UI 변경이면 Before/After 스크린샷. 로직 변경이면 재현 절차. -->

## 관련 이슈

<!-- Closes #이슈번호 -->
