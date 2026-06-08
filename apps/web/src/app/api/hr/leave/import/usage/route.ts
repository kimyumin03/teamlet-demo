import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { prisma } from "@teamlet/db";
import { assertPermission } from "@teamlet/modules/permission";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.employeeId || !session.user.id) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const actorId = session.user.employeeId;

  const employee = await prisma.employee.findUnique({
    where: { id: actorId },
    select: { companyId: true },
  });
  if (!employee) {
    return Response.json({ ok: false, error: "Employee not found" }, { status: 404 });
  }
  const companyId = employee.companyId;

  await assertPermission(actorId, "leave.balance.manage");

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return Response.json({ ok: false, error: "파일이 없어요." }, { status: 400 });
  }

  const arrayBuffer = await (file as File).arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return Response.json({ ok: false, error: "엑셀 시트를 찾을 수 없어요." }, { status: 400 });
  }

  // 헤더 행 제외하고 데이터 수집
  const dataRows: { rowIndex: number; raw: Record<string, unknown> }[] = [];
  sheet.eachRow((row, idx) => {
    if (idx === 1) return; // 헤더 스킵
    const values = row.values as unknown[];
    const raw = {
      name: values[1] ?? null,
      employeeNumber: values[2] ?? null,
      hireDate: values[3] ?? null,
      year: values[4] ?? null,
      month: values[5] ?? null,
      usage: values[6] ?? null,
    };
    // 완전히 빈 행 스킵 (예시 행 등)
    if (!raw.name && !raw.employeeNumber) return;
    dataRows.push({ rowIndex: idx, raw });
  });

  if (dataRows.length === 0) {
    return Response.json({ ok: false, error: "업로드할 데이터가 없어요." }, { status: 400 });
  }

  // BulkOperation 생성 (Anti-Pattern #11)
  const operation = await prisma.bulkOperation.create({
    data: {
      companyId,
      type: "LEAVE_USAGE_IMPORT",
      status: "PROCESSING",
      actorId,
      totalRows: dataRows.length,
    },
  });

  // 각 행을 BulkOperationRow로 저장 후 처리
  let successRows = 0;
  let failedRows = 0;

  for (const { rowIndex, raw } of dataRows) {
    try {
      // 구성원 조회
      const emp = await prisma.employee.findFirst({
        where: {
          companyId,
          OR: [
            { employeeNumber: String(raw.employeeNumber ?? "") },
            { name: String(raw.name ?? "") },
          ],
        },
        select: { id: true, leaveBalances: { select: { leaveTypeId: true, id: true }, where: { leaveType: { key: "annual" } }, take: 1 } },
      });

      if (!emp) {
        await prisma.bulkOperationRow.create({
          data: {
            operationId: operation.id,
            rowIndex,
            rawData: raw as object,
            status: "FAILED",
            error: `구성원을 찾을 수 없어요: ${raw.employeeNumber} / ${raw.name}`,
          },
        });
        failedRows++;
        continue;
      }

      const year = Number(raw.year);
      const month = Number(raw.month);
      const usageStr = String(raw.usage ?? "");

      // 사용량 파싱 (소수점 or 일·시간·분)
      let days = 0;
      const decimalMatch = usageStr.match(/^(\d+(?:\.\d+)?)$/);
      if (decimalMatch?.[1]) {
        days = parseFloat(decimalMatch[1]);
      } else {
        const hmsMatch = usageStr.match(/(?:(\d+)일\s*)?(?:(\d+)시간\s*)?(?:(\d+)분)?/);
        if (hmsMatch) {
          const d = parseInt(hmsMatch[1] ?? "0");
          const h = parseInt(hmsMatch[2] ?? "0");
          const m = parseInt(hmsMatch[3] ?? "0");
          days = d + h / 8 + m / 480;
        }
      }

      if (days <= 0 || isNaN(days)) {
        await prisma.bulkOperationRow.create({
          data: {
            operationId: operation.id,
            rowIndex,
            rawData: raw as object,
            status: "FAILED",
            error: `사용 시간을 파싱할 수 없어요: ${usageStr}`,
          },
        });
        failedRows++;
        continue;
      }

      const balance = emp.leaveBalances[0];
      if (!balance) {
        await prisma.bulkOperationRow.create({
          data: {
            operationId: operation.id,
            rowIndex,
            rawData: raw as object,
            status: "SKIPPED",
            error: "연차 잔여가 없는 구성원이에요.",
          },
        });
        failedRows++;
        continue;
      }

      // 연차 차감 트랜잭션 기록
      await prisma.$transaction([
        prisma.leaveTransaction.create({
          data: {
            employeeId: emp.id,
            leaveTypeId: balance.leaveTypeId,
            category: "ANNUAL",
            txType: "USE",
            days: -days,
            reason: `연차 사용 내역 일괄 업로드 (${year}년 ${month}월)`,
            actorId,
          },
        }),
        prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { usedDays: { increment: days } },
        }),
        prisma.bulkOperationRow.create({
          data: {
            operationId: operation.id,
            rowIndex,
            rawData: raw as object,
            status: "SUCCESS",
          },
        }),
      ]);

      successRows++;
    } catch (err) {
      await prisma.bulkOperationRow.create({
        data: {
          operationId: operation.id,
          rowIndex,
          rawData: raw as object,
          status: "FAILED",
          error: err instanceof Error ? err.message : "알 수 없는 오류",
        },
      });
      failedRows++;
    }
  }

  await prisma.bulkOperation.update({
    where: { id: operation.id },
    data: {
      status: failedRows === 0 ? "DONE" : successRows === 0 ? "FAILED" : "PARTIAL",
      successRows,
      failedRows,
    },
  });

  await prisma.auditLog.create({
    data: {
      companyId,
      actorUserId: session.user.id,
      activityType: "LEAVE_USAGE_IMPORT",
      eventType: "CREATE",
      targetType: "BulkOperation",
      targetId: operation.id,
      description: `연차 사용 내역 일괄 업로드 (총 ${dataRows.length}행, 성공 ${successRows}, 실패 ${failedRows})`,
      afterSnapshot: { totalRows: dataRows.length, successRows, failedRows },
    },
  });

  return Response.json({
    ok: true,
    data: { operationId: operation.id, totalRows: dataRows.length, successRows, failedRows },
  });
}
