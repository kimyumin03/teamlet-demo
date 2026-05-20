/**
 * 권한 카탈로그 조회 (docs/02 §11-1).
 * 전사 단일 카탈로그 — 회사 무관. UI 좌측 카테고리 탭이 바로 쓰도록
 * 카테고리 → 도메인 → read/manage 페어 순서로 그룹화하여 반환.
 */

import { prisma } from "@teamlet/db";
import type { PermissionAction, PermissionSensitivity } from "@teamlet/db";

/**
 * 카테고리 메타 — 슬러그는 `packages/db/seed/permissions.ts` 의 `category` 값과 일치.
 * 순서는 UI 가로 스크롤 탭 표시 순서 (docs/02 §11-1).
 */
export const PERMISSION_CATEGORIES = [
  { slug: "company", label: "회사 정보" },
  { slug: "member", label: "구성원" },
  { slug: "leave", label: "휴가" },
  { slug: "workflow", label: "워크플로우" },
  { slug: "document", label: "문서·증명서" },
  { slug: "recruit", label: "채용" },
  { slug: "tenancy", label: "멤버십·가입" },
  { slug: "permission", label: "권한" },
  { slug: "settings", label: "보안" },
  { slug: "notification", label: "알림" },
  { slug: "integration", label: "외부 연동" },
  { slug: "audit", label: "감사 로그" },
] as const;

export type PermissionCategorySlug = (typeof PERMISSION_CATEGORIES)[number]["slug"];

export type CatalogPermission = {
  id: string;
  key: string;
  category: string;
  domain: string;
  action: PermissionAction;
  name: string;
  description: string | null;
  sensitivity: PermissionSensitivity;
  hasScope: boolean;
  dependsOnPermissionKeys: string[];
  warningText: string | null;
};

/** 같은 도메인의 read/manage(/execute) 묶음 — UI 에서 한 행으로 표시 */
export type CatalogDomain = {
  slug: string;
  permissions: CatalogPermission[];
};

export type CatalogCategory = {
  slug: string;
  label: string;
  domains: CatalogDomain[];
};

const CATEGORY_ORDER = new Map(
  PERMISSION_CATEGORIES.map((c, i) => [c.slug as string, i]),
);
const CATEGORY_LABEL = new Map(
  PERMISSION_CATEGORIES.map((c) => [c.slug as string, c.label]),
);

const ACTION_ORDER: Record<PermissionAction, number> = {
  READ: 0,
  MANAGE: 1,
  EXECUTE: 2,
};

export async function getPermissionCatalog(): Promise<CatalogCategory[]> {
  const rows = await prisma.permission.findMany();

  const byCategory = new Map<string, Map<string, CatalogPermission[]>>();
  for (const r of rows) {
    let byDomain = byCategory.get(r.category);
    if (!byDomain) {
      byDomain = new Map();
      byCategory.set(r.category, byDomain);
    }
    let perms = byDomain.get(r.domain);
    if (!perms) {
      perms = [];
      byDomain.set(r.domain, perms);
    }
    perms.push({
      id: r.id,
      key: r.key,
      category: r.category,
      domain: r.domain,
      action: r.action,
      name: r.name,
      description: r.description,
      sensitivity: r.sensitivity,
      hasScope: r.hasScope,
      dependsOnPermissionKeys: r.dependsOnPermissionKeys,
      warningText: r.warningText,
    });
  }

  const categories: CatalogCategory[] = [];
  for (const [catSlug, byDomain] of byCategory) {
    const domains: CatalogDomain[] = [...byDomain.entries()]
      .map(([slug, permissions]) => ({
        slug,
        permissions: permissions.sort(
          (a, b) => ACTION_ORDER[a.action] - ACTION_ORDER[b.action],
        ),
      }))
      .sort((a, b) => a.slug.localeCompare(b.slug));

    categories.push({
      slug: catSlug,
      label: CATEGORY_LABEL.get(catSlug) ?? catSlug,
      domains,
    });
  }

  categories.sort((a, b) => {
    const ai = CATEGORY_ORDER.get(a.slug) ?? 999;
    const bi = CATEGORY_ORDER.get(b.slug) ?? 999;
    if (ai !== bi) return ai - bi;
    return a.slug.localeCompare(b.slug);
  });

  return categories;
}
