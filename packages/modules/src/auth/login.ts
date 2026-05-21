/**
 * 로그인 인증 (docs/06 §1.1). Credentials provider authorize 에서 호출.
 * 실패 잠금: 최근 15분 내 실패 N회(기본 5, CompanyLoginPolicy.max_login_attempts
 * 기본값) 초과 시 차단. 회사 컨텍스트는 로그인 후 결정되므로 전역 기본값 사용.
 */
import { prisma } from "@teamlet/db";
import { verifyPassword } from "./password";

const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 5;

export type AuthedUser = {
  id: string;
  email: string;
  name: string;
};

export type LoginContext = { ip?: string | null; userAgent?: string | null };

export async function authenticateUser(
  email: string,
  password: string,
  ctx: LoginContext = {},
): Promise<AuthedUser | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const recentFailures = await prisma.loginAttempt.count({
    where: {
      email: normalizedEmail,
      success: false,
      attemptedAt: { gte: new Date(Date.now() - LOCKOUT_WINDOW_MS) },
    },
  });
  if (recentFailures >= DEFAULT_MAX_ATTEMPTS) {
    await recordAttempt(normalizedEmail, null, false, "locked_out", ctx);
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.isActive) {
    await recordAttempt(normalizedEmail, user?.id ?? null, false, "no_user", ctx);
    return null;
  }

  if (!user.passwordHash) {
    // Google OAuth 전용 계정 — 자격증명 로그인 불가
    await recordAttempt(normalizedEmail, user.id, false, "no_password", ctx);
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await recordAttempt(normalizedEmail, user.id, false, "bad_password", ctx);
    return null;
  }

  await recordAttempt(normalizedEmail, user.id, true, null, ctx);
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { id: user.id, email: user.email, name: user.name };
}

async function recordAttempt(
  email: string,
  userId: string | null,
  success: boolean,
  failReason: string | null,
  ctx: LoginContext,
): Promise<void> {
  await prisma.loginAttempt.create({
    data: {
      email,
      userId,
      success,
      failReason,
      ip: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
    },
  });
}
