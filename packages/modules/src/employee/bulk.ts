import { prisma } from "@teamlet/db";
import { ok, err, errors, type Result } from "@teamlet/shared";
import { catchDomainErr, loadActor } from "../permission/_actor";
import { assertPermission } from "../permission";

const DIRECTORY_MANAGE = "member.directory.manage";

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  정규직: "FULL_TIME",
  파트타임: "PART_TIME",
  계약직: "CONTRACT",
  인턴: "INTERN",
  파견: "DISPATCH",
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  CONTRACT: "CONTRACT",
  INTERN: "INTERN",
  DISPATCH: "DISPATCH",
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type BulkEmployeeRow = {
  name: string;
  employeeNumber?: string;
  companyEmail?: string;
  hireDate?: string;
  departmentName?: string;
  positionName?: string;
  employmentType?: string;
};

export type BulkCreateResult = {
  row: number;
  name: string;
  ok: boolean;
  error?: string;
};

export async function bulkCreateEmployees(
  actorEmployeeId: string,
  rows: BulkEmployeeRow[],
): Promise<Result<BulkCreateResult[]>> {
  try {
    await assertPermission(actorEmployeeId, DIRECTORY_MANAGE);
  } catch (e) {
    return catchDomainErr(e);
  }

  const actor = await loadActor(actorEmployeeId);
  if (!actor) return err(errors.notFound("회사 컨텍스트를 찾을 수 없어요"));

  // 부서/직책 이름 → id 맵 (한 번만 조회)
  const [depts, positions] = await Promise.all([
    prisma.department.findMany({
      where: { companyId: actor.companyId, isActive: true },
      select: { id: true, name: true },
    }),
    prisma.position.findMany({
      where: { companyId: actor.companyId, isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  const deptMap = new Map(depts.map((d) => [d.name, d.id]));
  const posMap = new Map(positions.map((p) => [p.name, p.id]));

  const results: BulkCreateResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const rowNum = i + 1;

    if (!row.name?.trim()) {
      results.push({ row: rowNum, name: row.name ?? "", ok: false, error: "이름은 필수예요" });
      continue;
    }

    const name = row.name.trim();
    const employeeNumber = row.employeeNumber?.trim() || null;
    const companyEmail = row.companyEmail?.trim() || null;
    const hireDateRaw = row.hireDate?.trim() || null;
    const departmentName = row.departmentName?.trim() || null;
    const positionName = row.positionName?.trim() || null;
    const empTypeRaw = row.employmentType?.trim() || null;

    if (companyEmail && !EMAIL_RE.test(companyEmail)) {
      results.push({ row: rowNum, name, ok: false, error: "이메일 형식이 올바르지 않아요" });
      continue;
    }

    let hireDate: Date | null = null;
    if (hireDateRaw) {
      if (!DATE_RE.test(hireDateRaw)) {
        results.push({ row: rowNum, name, ok: false, error: "입사일은 YYYY-MM-DD 형식이어야 해요" });
        continue;
      }
      hireDate = new Date(`${hireDateRaw}T00:00:00.000Z`);
    }

    const departmentId = departmentName ? (deptMap.get(departmentName) ?? null) : null;
    if (departmentName && !departmentId) {
      results.push({ row: rowNum, name, ok: false, error: `부서 "${departmentName}"를 찾을 수 없어요` });
      continue;
    }

    const positionId = positionName ? (posMap.get(positionName) ?? null) : null;
    if (positionName && !positionId) {
      results.push({ row: rowNum, name, ok: false, error: `직책 "${positionName}"을 찾을 수 없어요` });
      continue;
    }

    const employmentType =
      empTypeRaw ? (EMPLOYMENT_TYPE_MAP[empTypeRaw] ?? "FULL_TIME") : "FULL_TIME";

    try {
      await prisma.employee.create({
        data: {
          companyId: actor.companyId,
          name,
          employeeNumber,
          companyEmail,
          hireDate,
          departmentId,
          positionId,
          employmentType: employmentType as import("@prisma/client").EmploymentType,
        },
      });
      results.push({ row: rowNum, name, ok: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "알 수 없는 오류";
      const isDup = msg.includes("Unique constraint");
      results.push({
        row: rowNum,
        name,
        ok: false,
        error: isDup ? "이미 등록된 이메일이에요" : "생성 실패",
      });
    }
  }

  return ok(results);
}
