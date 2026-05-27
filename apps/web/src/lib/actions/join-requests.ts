"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { approveMembership, rejectMembership } from "@teamlet/modules/tenancy";
import { auth } from "@/auth";

async function requireEmployeeId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.employeeId) redirect("/login");
  return session.user.employeeId;
}

export async function approveMembershipAction(membershipId: string): Promise<{ error: string | null }> {
  const employeeId = await requireEmployeeId();
  const result = await approveMembership(employeeId, membershipId);
  if (!result.ok) return { error: result.error.message };
  revalidatePath("/settings/join-requests");
  return { error: null };
}

export async function rejectMembershipAction(membershipId: string): Promise<{ error: string | null }> {
  const employeeId = await requireEmployeeId();
  const result = await rejectMembership(employeeId, membershipId);
  if (!result.ok) return { error: result.error.message };
  revalidatePath("/settings/join-requests");
  return { error: null };
}
