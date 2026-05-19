"use server";

import { AuthError } from "next-auth";
import { createUserAccount } from "@teamlet/modules/auth";
import { signupSchema } from "@teamlet/shared";
import { signIn } from "@/auth";

export type ActionState = { error: string | null };

/** 로그인 (docs/06 §1.1) */
export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await signIn("credentials", { email, password, redirectTo: "/home" });
    return { error: null };
  } catch (e) {
    // redirect 신호는 AuthError 가 아니므로 re-throw 되어 정상 동작
    if (e instanceof AuthError) {
      return { error: "이메일 또는 비밀번호가 올바르지 않아요" };
    }
    throw e;
  }
}

/** 회원가입 → 자동 로그인 → 회사 가입 흐름 (docs/06 §1.2) */
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

  try {
    await signIn("credentials", {
      email: raw.email,
      password: raw.password,
      redirectTo: "/join-company",
    });
    return { error: null };
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "가입은 완료됐어요. 로그인해 주세요." };
    }
    throw e;
  }
}
