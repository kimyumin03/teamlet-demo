/**
 * 직원 도메인 (docs/06 §2 구성원). P2 Core HR 시작점.
 *
 * P2 1단계: 디렉토리 read 흐름만 (listEmployees / getEmployee).
 * P2 2단계 이후: 직원 추가/수정/비활성화, 부서 연결, 직책/PositionHistory.
 *
 * 권한: `member.directory.read` (ALL scope 만 P1 평가 모듈 지원).
 * - SUPER_ADMIN: ALL → 회사 전체
 * - 일반 직원: 권한 미보유 → 페이지 진입 자체 막힘
 * - SELF scope: P2 에서 자기 자신만 보이는 분기 추가 예정
 */

import { prisma } from "@teamlet/db";
import type { EmploymentStatus } from "@teamlet/db";
import { err, errors, ok, type Result } from "@teamlet/shared";
import { catchDomainErr, loadActor } from "../permission/_actor";
import { assertPermission } from "../permission/assert";

const DIRECTORY_READ = "member.directory.read";

export type EmployeeListItem = {
  id: string;
  name: string;
  employeeNumber: string | null;
  companyEmail: string | null;
  hireDate: Date | null;
  employmentStatus: EmploymentStatus;
  isActive: boolean;
};

export async function listEmployees(
  actorEmployeeId: string,
): Promise<Result<EmployeeListItem[]>> {
  try {
    await assertPermission(actorEmployeeId, DIRECTORY_READ);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  const employees = await prisma.employee.findMany({
    where: { companyId: actor.companyId },
    select: {
      id: true,
      name: true,
      employeeNumber: true,
      companyEmail: true,
      hireDate: true,
      employmentStatus: true,
      isActive: true,
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return ok(employees);
}
