import { prisma } from "@teamlet/db";
import {
  profileUpdateSchema,
  changePasswordSchema,
  type ProfileUpdateInput,
  type ChangePasswordInput,
  type Result,
  ok,
  err,
  errors,
} from "@teamlet/shared";
import { hashPassword, verifyPassword } from "./password";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  hasPassword: boolean;
};

export async function getUserProfile(userId: string): Promise<Result<UserProfile>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, passwordHash: true },
  });
  if (!user) return err(errors.notFound("사용자를 찾을 수 없어요"));
  return ok({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    hasPassword: !!user.passwordHash,
  });
}

export async function updateUserProfile(
  userId: string,
  input: ProfileUpdateInput,
): Promise<Result<void>> {
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return err(errors.validation(parsed.error.issues[0]?.message ?? "입력 오류"));
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return err(errors.notFound("사용자를 찾을 수 없어요"));

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
    },
  });

  return ok(undefined);
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<Result<void>> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return err(errors.validation(parsed.error.issues[0]?.message ?? "입력 오류"));
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return err(errors.notFound("사용자를 찾을 수 없어요"));
  if (!user.passwordHash) {
    return err(errors.validation("소셜 로그인 계정은 비밀번호를 변경할 수 없어요"));
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return err(errors.validation("현재 비밀번호가 올바르지 않아요"));
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  return ok(undefined);
}
