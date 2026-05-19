/**
 * @teamlet/modules — 도메인 비즈니스 로직 (재사용 가능, UI 비의존).
 * 도메인 맵 (docs/04 §2):
 *   auth     — 로그인/회원가입/권한 평가(catalog·evaluator·scope·cache)/MFA/세션
 *   tenancy  — 멀티 테넌시 (회사신청/가입요청/초대/멤버십)
 *   employee — 직원 CRUD + 시점 이력 + 벌크(CSV/AxHub 공통)
 *   leave    — 휴가 정책 엔진 + 휴가 종류 + 회계장부 + 신청
 *   workflow — 양식 + 결재 (per-requester 라우팅)
 *   audit    — 감사 로그 (정보 분류 + diff)
 *   notification / search / integrations(axhub) ...
 *
 * Phase 1 구현: auth, tenancy, audit (Step 2~5에서 채움).
 */
export {};
