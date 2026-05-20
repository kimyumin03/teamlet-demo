/**
 * 권한 모듈 공통 헬퍼 — `role.ts` / `mapping.ts` / `userrole.ts` 가 공유.
 *
 * - loadActor: actor employeeId → 회사 + 사용자 id (cross-tenant / audit 용)
 * - catchDomainErr: assertPermission 의 throw 를 Result 로 변환
 */

import { prisma } from "@teamlet/db";
import { DomainError, err, type Result } from "@teamlet/shared";

export type Actor = { companyId: string; userId: string };

export async function loadActor(
  actorEmployeeId: string,
): Promise<Actor | null> {
  const e = await prisma.employee.findUnique({
    where: { id: actorEmployeeId },
    select: {
      companyId: true,
      membership: { select: { userId: true } },
    },
  });
  if (!e || !e.membership) return null;
  return { companyId: e.companyId, userId: e.membership.userId };
}

export function catchDomainErr<T>(e: unknown): Result<T> {
  if (e instanceof DomainError) return err(e);
  throw e;
}
