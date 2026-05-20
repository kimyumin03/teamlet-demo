"use server";

import { redirect } from "next/navigation";
import {
  createDepartment,
  deleteDepartment,
  updateDepartment,
} from "@teamlet/modules/department";
import {
  toApiResponse,
  type ApiResponse,
  type DepartmentCreateInput,
  type DepartmentUpdateInput,
} from "@teamlet/shared";
import { auth } from "@/auth";

async function requireEmployeeId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.employeeId) redirect("/join-company");
  return session.user.employeeId;
}

/** 부서 추가 — `member.directory.manage` 가드 (모듈 내부) */
export async function createDepartmentAction(
  input: DepartmentCreateInput,
): Promise<ApiResponse<{ departmentId: string }>> {
  const employeeId = await requireEmployeeId();
  return toApiResponse(await createDepartment(employeeId, input));
}

/** 부서 이름 변경 */
export async function updateDepartmentAction(
  departmentId: string,
  input: DepartmentUpdateInput,
): Promise<ApiResponse<{ departmentId: string }>> {
  const employeeId = await requireEmployeeId();
  return toApiResponse(
    await updateDepartment(employeeId, departmentId, input),
  );
}

/** 부서 삭제 (soft) — 자식/직원 있으면 거절 */
export async function deleteDepartmentAction(
  departmentId: string,
): Promise<ApiResponse<{ departmentId: string }>> {
  const employeeId = await requireEmployeeId();
  return toApiResponse(await deleteDepartment(employeeId, departmentId));
}
