/**
 * @teamlet/modules — 도메인 비즈니스 로직 (재사용 가능, UI 비의존).
 * Phase 1 구현: auth, tenancy, audit, permission. (Phase 2+: employee/leave/workflow/...)
 */
export * as auth from "./auth/index";
export * as tenancy from "./tenancy/index";
export * as audit from "./audit/index";
export * as permission from "./permission/index";
