"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { createUserAccount } from "@teamlet/modules/auth";
import { verifyMfaCode } from "@teamlet/modules/security";
import { signupSchema } from "@teamlet/shared";
import { signIn, auth } from "@/auth";
import { signMfaToken } from "@/lib/mfa-token";
import { isPlatformAdminEmail } from "@/lib/platform-admin";

export async function googleLoginAction() {
  await signIn("google", { redirectTo: "/home" });
}

export type ActionState = { error: string | null };

function safeCallbackUrl(raw: string | null | undefined): string {
  if (!raw) return "/home";
  if (!raw.startsWith("/")) return "/home";
  // /admin 은 플랫폼 관리자 전용 — 일반 로그인 콜백으로 허용하지 않음
  if (raw.startsWith("/admin")) return "/home";
  return raw;
}

/** 로그인 (docs/06 §1.1) — 이메일 전용. 플랫폼 관리자는 비밀키 페이지로 분기. */
export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "이메일을 입력해 주세요" };

  if (isPlatformAdminEmail(email)) {
    redirect(`/admin-key?email=${encodeURIComponent(email)}`);
  }

  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl") as string | null);
  try {
    await signIn("credentials", { email, redirectTo: callbackUrl });
    return { error: null };
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "등록되지 않은 이메일이에요" };
    }
    throw e;
  }
}

/** 플랫폼 관리자 비밀키 인증 후 로그인 */
export async function adminKeyLoginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const adminKey = String(formData.get("adminKey") ?? "").trim();

  if (!isPlatformAdminEmail(email)) return { error: "관리자 이메일이 아니에요" };

  const secret = process.env.PLATFORM_ADMIN_SECRET;
  if (!secret || adminKey !== secret) return { error: "비밀키가 올바르지 않아요" };

  try {
    await signIn("credentials", { email, adminKey, redirectTo: "/admin" });
    return { error: null };
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "등록되지 않은 관리자 이메일이에요" };
    }
    throw e;
  }
}

/** 회원가입 → 자동 로그인 → callbackUrl 또는 회사 가입 흐름 (docs/06 §1.2) */
export async function signupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? "").replace(/\D/g, ""),
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요" };
  }

  const result = await createUserAccount(parsed.data);
  if (!result.ok) {
    return { error: result.error.message };
  }

  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl") as string | null);
  const redirectTo = callbackUrl !== "/home" ? callbackUrl : "/join-company";

  try {
    await signIn("credentials", { email: raw.email, redirectTo });
    return { error: null };
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "가입은 완료됐어요. 로그인해 주세요." };
    }
    throw e;
  }
}

/** 2FA 코드 검증 후 mfaPending 해제 */
export async function verify2faAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "로그인이 필요해요" };

  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "인증 코드를 입력해 주세요" };

  const valid = await verifyMfaCode(session.user.id, code);
  if (!valid) return { error: "인증 코드가 올바르지 않아요" };

  const token = signMfaToken(session.user.id);
  await signIn("credentials", { email: session.user.email!, mfaToken: token, redirectTo: "/home" });
  return { error: null };
}
