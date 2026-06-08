import ExcelJS from "exceljs";
import { auth } from "@/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.employeeId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const unit = searchParams.get("unit") ?? "hm"; // "hm" = 일·시간·분, "decimal" = 소수점

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Teamlet";
  const sheet = workbook.addWorksheet("연차 사용 내역");

  const usageHeader = unit === "decimal" ? "사용 시간 (소수점)" : "사용 시간 (일·시간·분)";

  sheet.columns = [
    { header: "이름", key: "name", width: 12 },
    { header: "사번", key: "employeeNumber", width: 12 },
    { header: "입사일 (YYYY-MM-DD)", key: "hireDate", width: 22 },
    { header: "연도", key: "year", width: 8 },
    { header: "월 (1~12)", key: "month", width: 10 },
    { header: usageHeader, key: "usage", width: 22 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin", color: { argb: "FFE2E8F0" } },
      bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
  });

  // 예시 행
  const exampleRow = sheet.addRow({
    name: "홍길동",
    employeeNumber: "001",
    hireDate: "2024-01-15",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    usage: unit === "decimal" ? "1.5" : "1일 4시간 0분",
  });
  exampleRow.font = { color: { argb: "FF94A3B8" }, italic: true };
  exampleRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };

  // 안내 시트
  const guideSheet = workbook.addWorksheet("작성 안내");
  guideSheet.getCell("A1").value = "연차 사용 내역 업로드 양식 안내";
  guideSheet.getCell("A1").font = { bold: true, size: 13 };
  guideSheet.getCell("A3").value = `• 사용 시간 단위: ${unit === "decimal" ? "소수점 (예: 1.5)" : "일·시간·분 (예: 1일 4시간 0분)"}`;
  guideSheet.getCell("A4").value = "• 회색 예시 행은 삭제 후 실제 데이터를 입력해 주세요.";
  guideSheet.getCell("A5").value = "• 구성원의 근무·휴가 기록이 없는 날에만 기록할 수 있습니다.";
  guideSheet.getColumn("A").width = 60;

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `연차사용내역_업로드양식.xlsx`;

  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
