"use server";

import { auth } from "@/auth";
import { updateUserProfile, changePassword } from "@teamlet/modules/auth";

export type ProfileActionState = { error: string | null; success?: boolean };

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "로그인이 필요해요" };

  const result = await updateUserProfile(session.user.id, {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });

  if (!result.ok) return { error: result.error.message };
  return { error: null, success: true };
}

export async function changePasswordAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "로그인이 필요해요" };

  const result = await changePassword(session.user.id, {
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    newPasswordConfirm: String(formData.get("newPasswordConfirm") ?? ""),
  });

  if (!result.ok) return { error: result.error.message };
  return { error: null, success: true };
}
