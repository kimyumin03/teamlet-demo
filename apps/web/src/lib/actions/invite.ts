"use server";

import { auth } from "@/auth";
import { createEmployeeInvite, acceptEmployeeInvite } from "@teamlet/modules/auth";
import { redirect } from "next/navigation";

export type InviteActionState = { error: string | null; inviteUrl?: string };

/** 직원 초대 링크 생성 (HR). 생성된 URL을 반환 — 실제 이메일 발송은 추후 Worker로. */
export async function generateInviteLinkAction(
  _prev: InviteActionState,
  formData: FormData,
): Promise<InviteActionState> {
  const session = await auth();
  if (!session?.user?.employeeId) return { error: "인증 오류" };

  const employeeId = String(formData.get("employeeId") ?? "");
  if (!employeeId) return { error: "직원 ID가 없어요" };

  const result = await createEmployeeInvite(session.user.employeeId, employeeId);
  if (!result.ok) return { error: result.error.message };

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const inviteUrl = `${baseUrl}/invite/${result.data.rawToken}`;
  return { error: null, inviteUrl };
}

/** 로그인한 사용자가 초대 수락 → 성공 시 /home 리디렉트. */
export async function acceptInviteAction(rawToken: string): Promise<{ error: string } | never> {
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/invite/${rawToken}`);

  const result = await acceptEmployeeInvite(session.user.id, rawToken);
  if (!result.ok) return { error: result.error.message };

  redirect("/home");
}
