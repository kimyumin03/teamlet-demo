export { assertPermission, hasPermission } from "./assert";
export {
  getPermissionCatalog,
  PERMISSION_CATEGORIES,
} from "./catalog";
export { getEffectivePermissions } from "./effective";
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
