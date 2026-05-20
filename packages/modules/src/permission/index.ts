export { assertPermission, hasPermission } from "./assert";
export { bootstrapCompanyRoles } from "./bootstrap";
export type { BootstrapResult } from "./bootstrap";
export {
  getPermissionCatalog,
  PERMISSION_CATEGORIES,
} from "./catalog";
export { getEffectivePermissions } from "./effective";
export {
  assertNotLastSuperAdmin,
  countActiveSuperAdmins,
} from "./lockout";
export { setRolePermissions } from "./mapping";
export { createRole, deleteRole, listRoles, updateRole } from "./role";
export type { RoleListItem } from "./role";
export { matchesScope } from "./scope";
export type {
  CatalogCategory,
  CatalogDomain,
  CatalogPermission,
  PermissionCategorySlug,
} from "./catalog";
export type {
  EffectivePermission,
  PermissionKey,
  ScopeContext,
} from "./types";
