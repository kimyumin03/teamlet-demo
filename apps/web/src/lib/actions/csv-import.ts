"use server";

import { auth } from "@/auth";
import { bulkCreateEmployees, type BulkCreateResult } from "@teamlet/modules/employee";

export type CsvImportState = {
  error: string | null;
  results?: BulkCreateResult[];
  total?: number;
  successCount?: number;
};

/** RFC 4180-호환 간이 CSV 파서 (큰따옴표 묶음 지원). */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuote = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ",") { fields.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
  }
  fields.push(cur.trim());
  return fields;
}

export async function csvImportAction(
  _prev: CsvImportState,
  formData: FormData,
): Promise<CsvImportState> {
  const session = await auth();
  if (!session?.user?.employeeId) return { error: "로그인이 필요해요" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "CSV 파일을 선택해 주세요" };
  }
  if (file.size > 1024 * 1024) {
    return { error: "파일 크기는 1MB 이하여야 해요" };
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { error: "데이터가 없어요. 헤더 행 포함 2행 이상이어야 해요" };
  }

  // 헤더 행 건너뜀
  const dataLines = lines.slice(1);
  const rows = dataLines.map((line) => {
    const [name, employeeNumber, companyEmail, hireDate, departmentName, positionName, employmentType] =
      parseCsvLine(line);
    return { name: name ?? "", employeeNumber, companyEmail, hireDate, departmentName, positionName, employmentType };
  });

  const result = await bulkCreateEmployees(session.user.employeeId, rows);
  if (!result.ok) return { error: result.error.message };

  const successCount = result.data.filter((r) => r.ok).length;
  return {
    error: null,
    results: result.data,
    total: result.data.length,
    successCount,
  };
}
