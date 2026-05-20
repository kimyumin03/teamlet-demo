export { assertPermission, hasPermission } from "./assert";
export {
  getPermissionCatalog,
  PERMISSION_CATEGORIES,
} from "./catalog";
export { getEffectivePermissions } from "./effective";
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
