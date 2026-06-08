import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { listLeaveGrantHistory } from "@teamlet/modules/leave";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.employeeId) {
    return new Response("Unauthorized", { status: 401 });
  }
  const actorId = session.user.employeeId;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const targetEmployeeId = searchParams.get("employeeId") ?? undefined;
  const leaveTypeIds = searchParams.get("leaveTypeIds")?.split(",").filter(Boolean) ?? [];
  const statuses = searchParams.get("statuses")?.split(",").filter(Boolean) ?? [];

  const result = await listLeaveGrantHistory(actorId, {
    ...(targetEmployeeId ? { employeeId: targetEmployeeId } : {}),
  });
  if (!result.ok) {
    return new Response("Failed to fetch data", { status: 500 });
  }

  let rows = result.data;

  if (from) {
    const fromDate = new Date(from);
    rows = rows.filter((r) => new Date(r.occurredAt) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    rows = rows.filter((r) => new Date(r.occurredAt) <= toDate);
  }
  if (leaveTypeIds.length > 0) {
    rows = rows.filter((r) => leaveTypeIds.includes(r.leaveTypeName));
  }
  if (statuses.length > 0 && statuses.length < 3) {
    rows = rows.filter((r) => {
      const isGrant = r.txType === "GRANT" && r.days > 0;
      if (statuses.includes("unused") && isGrant) return true;
      if (statuses.includes("adjust") && r.txType === "ADJUST") return true;
      return false;
    });
  }

  function fmtDate(d: Date | string) {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  }
  function fmtDateTime(d: Date | string) {
    const dt = new Date(d);
    return `${fmtDate(dt)} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Teamlet";
  const sheet = workbook.addWorksheet("맞춤 휴가 부여 내역");

  sheet.columns = [
    { header: "부여 대상자", key: "employeeName", width: 14 },
    { header: "휴가 종류", key: "leaveTypeName", width: 18 },
    { header: "부여자", key: "actorName", width: 12 },
    { header: "부여 일시", key: "occurredAt", width: 20 },
    { header: "일수", key: "days", width: 8 },
    { header: "구분", key: "txType", width: 8 },
    { header: "사유", key: "reason", width: 24 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };

  for (const r of rows) {
    sheet.addRow({
      employeeName: r.employeeName,
      leaveTypeName: r.leaveTypeName,
      actorName: r.actorName ?? "자동 부여",
      occurredAt: fmtDateTime(r.occurredAt),
      days: Number(r.days),
      txType: r.txType === "GRANT" ? "부여" : "조정",
      reason: r.reason ?? "",
    });
  }

  sheet.eachRow((row, idx) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
    if (idx > 1) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? "FFF8FAFC" : "FFFFFFFF" } };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `맞춤휴가부여내역_${fmtDate(new Date())}.xlsx`;

  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
