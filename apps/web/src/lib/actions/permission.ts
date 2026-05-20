"use server";

import { redirect } from "next/navigation";
import {
  getPermissionCatalog,
  type CatalogCategory,
} from "@teamlet/modules/permission";
import { auth } from "@/auth";

/**
 * 권한 카탈로그 조회 (docs/02 §11-1 좌측 카테고리 탭).
 * 회사 소속 직원만 호출 가능. 권한 가드는 호출 페이지에서 별도 적용.
 */
export async function getPermissionCatalogAction(): Promise<CatalogCategory[]> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");
  return getPermissionCatalog();
}
