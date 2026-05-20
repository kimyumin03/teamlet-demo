"use server";

import { redirect } from "next/navigation";
import { createEmployee, updateEmployee } from "@teamlet/modules/employee";
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
