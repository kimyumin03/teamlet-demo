"use server";

import { redirect } from "next/navigation";
import { createDepartment } from "@teamlet/modules/department";
import {
  toApiResponse,
  type ApiResponse,
  type DepartmentCreateInput,
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
