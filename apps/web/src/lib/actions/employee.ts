"use server";

import { redirect } from "next/navigation";
import {
  createEmployee,
  deactivateEmployee,
  updateEmployee,
} from "@teamlet/modules/employee";
import {
  toApiResponse,
  type ApiResponse,
  type EmployeeCreateInput,
  type EmployeeUpdateInput,
} from "@teamlet/shared";
import { auth } from "@/auth";

async function requireEmployeeId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");
  return session.user.employeeId;
}

/** 구성원 추가 — `member.directory.manage` 가드 (모듈 내부) */
export async function createEmployeeAction(
  input: EmployeeCreateInput,
): Promise<ApiResponse<{ employeeId: string }>> {
  const employeeId = await requireEmployeeId();
  return toApiResponse(await createEmployee(employeeId, input));
}

/** 구성원 정보 수정 — `member.directory.manage` 가드 (모듈 내부) */
export async function updateEmployeeAction(
  targetEmployeeId: string,
  input: EmployeeUpdateInput,
): Promise<ApiResponse<{ employeeId: string }>> {
  const employeeId = await requireEmployeeId();
  return toApiResponse(
    await updateEmployee(employeeId, targetEmployeeId, input),
  );
}

/** 구성원 비활성화 (퇴직) — 락아웃 가드 (마지막 SUPER_ADMIN 차단) */
export async function deactivateEmployeeAction(
  targetEmployeeId: string,
  reason?: string,
): Promise<ApiResponse<{ employeeId: string }>> {
  const employeeId = await requireEmployeeId();
  return toApiResponse(
    await deactivateEmployee(employeeId, targetEmployeeId, reason),
  );
}
