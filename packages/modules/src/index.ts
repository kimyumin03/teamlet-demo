/**
 * @teamlet/modules — 도메인 비즈니스 로직 (재사용 가능, UI 비의존).
 * Phase 1: auth, tenancy, audit, permission.
 * Phase 2 (진행 중): employee — 디렉토리 read.
 */
export * as auth from "./auth/index";
export * as tenancy from "./tenancy/index";
export * as audit from "./audit/index";
export * as permission from "./permission/index";
export * as employee from "./employee/index";
export * as department from "./department/index";
export * as position from "./position/index";
