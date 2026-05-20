"use server";

import { redirect } from "next/navigation";
import {
  submitJoinByCode,
  submitCompanyApplication,
} from "@teamlet/modules/tenancy";
import { auth } from "@/auth";

export type ActionState = { error: string | null };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

/** 회사코드로 가입 신청 (docs/06 §1.2 옵션 2) */
export async function joinByCodeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const result = await submitJoinByCode(userId, {
    companyCode: String(formData.get("companyCode") ?? ""),
    memo: String(formData.get("memo") ?? "") || undefined,
  });
  if (!result.ok) return { error: result.error.message };
  redirect("/pending-approval");
}

/** 회사 등록 신청 (docs/06 §1.2 register-company) */
export async function companyApplicationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const result = await submitCompanyApplication(userId, {
    companyName: String(formData.get("companyName") ?? ""),
    businessNumber: String(formData.get("businessNumber") ?? ""),
    representativeName: String(formData.get("representativeName") ?? ""),
    contact: String(formData.get("contact") ?? ""),
    companySize: String(
      formData.get("companySize") ?? "1-10",
    ) as "1-10" | "11-50" | "51-200" | "201-1000" | "1000+",
    industry: String(formData.get("industry") ?? ""),
    memo: String(formData.get("memo") ?? "") || undefined,
  });
  if (!result.ok) return { error: result.error.message };
  // 데모 모드 자가-승인 시 홈으로. 일반 흐름은 검토 대기 페이지로.
  redirect(result.data.autoApproved ? "/home" : "/pending-approval");
}
