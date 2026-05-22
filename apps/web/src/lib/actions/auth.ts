"use server";

import { AuthError } from "next-auth";
import { createUserAccount } from "@teamlet/modules/auth";
import { signupSchema } from "@teamlet/shared";
import { signIn } from "@/auth";

export async function googleLoginAction() {
  await signIn("google", { redirectTo: "/home" });
}

export type ActionState = { error: string | null };

function safeCallbackUrl(raw: string | null | undefined): string {
  if (!raw) return "/home";
  // 외부 URL 리디렉션 방지 — 상대 경로만 허용
  return raw.startsWith("/") ? raw : "/home";
}

/** 로그인 (docs/06 §1.1) */
export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const mfaCode = String(formData.get("mfaCode") ?? "") || undefined;
  const redirectTo = safeCallbackUrl(formData.get("callbackUrl") as string | null);
  try {
    await signIn("credentials", { email, password, mfaCode, redirectTo });
    return { error: null };
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "이메일, 비밀번호 또는 인증 코드가 올바르지 않아요" };
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
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
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
    await signIn("credentials", {
      email: raw.email,
      password: raw.password,
      redirectTo,
    });
    return { error: null };
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "가입은 완료됐어요. 로그인해 주세요." };
    }
    throw e;
  }
}
