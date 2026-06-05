"use server";

import { redirect } from "next/navigation";
import { prisma } from "@teamlet/db";
import { auth } from "@/auth";
import { listHomeEvents } from "@teamlet/modules/employee";
import type { HomeEventItem } from "@teamlet/modules/employee";

export type EmployeeSearchResult = {
  id: string;
  name: string;
  departmentName: string | null;
  positionName: string | null;
  companyEmail: string | null;
};

export async function searchEmployeesAction(query: string): Promise<EmployeeSearchResult[]> {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");

  if (!query.trim() || query.trim().length < 1) return [];

  const actor = await prisma.employee.findUnique({
    where: { id: session.user.employeeId },
    select: { companyId: true },
  });
  if (!actor) return [];

  const employees = await prisma.employee.findMany({
    where: {
      companyId: actor.companyId,
      isActive: true,
      name: { contains: query.trim(), mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      companyEmail: true,
      department: { select: { name: true } },
      position: { select: { name: true } },
    },
    take: 8,
    orderBy: { name: "asc" },
  });

  return employees.map((e) => ({
    id: e.id,
    name: e.name,
    departmentName: e.department?.name ?? null,
    positionName: e.position?.name ?? null,
    companyEmail: e.companyEmail,
  }));
}

/** 팔레트 열릴 때 빈 상태에 보여줄 오늘의 이벤트 */
export async function getSearchPreviewAction(): Promise<HomeEventItem[]> {
  const session = await auth();
  if (!session?.user?.employeeId) return [];
  return listHomeEvents(session.user.employeeId);
}
