"use server";

import { auth } from "@/auth";
import { getMembershipSummary } from "@teamlet/modules/tenancy";

export async function checkApprovalStatus(): Promise<"approved" | "rejected" | "pending"> {
  const session = await auth();
  if (!session?.user?.id) return "pending";
  const summary = await getMembershipSummary(session.user.id);
  if (summary.active.length > 0) return "approved";
  if (summary.rejected) return "rejected";
  return "pending";
}
