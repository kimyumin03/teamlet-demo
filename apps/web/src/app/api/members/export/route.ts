import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listEmployees } from "@teamlet/modules/employee";

const EMP_TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "정규직",
  PART_TIME: "파트타임",
  CONTRACT: "계약직",
  INTERN: "인턴",
  DISPATCH: "파견",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "재직",
  PROBATION: "수습",
  ON_LEAVE: "휴직",
  SECONDED: "파견",
  RESIGNED: "퇴직",
  SCHEDULED: "입사 예정",
};

function csvCell(value: string | null | undefined): string {
  const s = value ?? "";
  // RFC 4180: 쉼표·큰따옴표·줄바꿈 포함 시 따옴표로 감쌈
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\. /g, "-").replace(".", "");
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.employeeId) {
    return NextResponse.json({ error: "No employee context" }, { status: 403 });
  }

  const result = await listEmployees(session.user.employeeId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 403 });
  }

  const headers = ["이름", "사원번호", "회사이메일", "입사일", "부서명", "직책명", "고용형태", "재직상태"];
  const rows = result.data.map((e) => [
    csvCell(e.name),
    csvCell(e.employeeNumber),
    csvCell(e.companyEmail),
    csvCell(formatDate(e.hireDate)),
    csvCell(e.departmentName),
    csvCell(e.positionName),
    csvCell(EMP_TYPE_LABEL[e.employmentType] ?? e.employmentType),
    csvCell(STATUS_LABEL[e.employmentStatus] ?? e.employmentStatus),
  ]);

  // BOM(EF BB BF) 추가 — 엑셀에서 UTF-8 한글 깨짐 방지
  const bom = "﻿";
  const csv = bom + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  const today = new Date().toISOString().slice(0, 10);
  const filename = `members_${today}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
