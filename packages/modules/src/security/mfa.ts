import { prisma } from "@teamlet/db";
import { generateSecret, generateSync, verifySync, generateURI } from "otplib";
import { ok, err, errors, type Result } from "@teamlet/shared";

const ISSUER = "Teamlet";

export type MfaStatus = {
  isEnabled: boolean;
  enabledAt: Date | null;
};

export async function getMfaStatus(userId: string): Promise<MfaStatus> {
  const mfa = await prisma.userMFA.findUnique({
    where: { userId },
    select: { isEnabled: true, enabledAt: true },
  });
  return { isEnabled: mfa?.isEnabled ?? false, enabledAt: mfa?.enabledAt ?? null };
}

/** TOTP 비밀키 생성 + 임시 저장 (isEnabled=false). 이미 활성화된 경우 재생성 차단. */
export async function generateMfaSecret(
  userId: string,
): Promise<Result<{ secret: string; otpauthUrl: string }>> {
  const existing = await prisma.userMFA.findUnique({
    where: { userId },
    select: { isEnabled: true },
  });
  if (existing?.isEnabled) {
    return err(errors.conflict("이미 2FA가 활성화되어 있어요. 비활성화 후 재설정하세요."));
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) return err(errors.notFound("사용자를 찾을 수 없어요"));

  const secret = generateSecret();
  const otpauthUrl = generateURI({ label: user.email, secret, issuer: ISSUER });

  await prisma.userMFA.upsert({
    where: { userId },
    create: { userId, secret, isEnabled: false },
    update: { secret, isEnabled: false, enabledAt: null },
  });

  return ok({ secret, otpauthUrl });
}

/** TOTP 코드 검증 후 2FA 활성화. */
export async function enableMfa(userId: string, code: string): Promise<Result<void>> {
  const mfa = await prisma.userMFA.findUnique({
    where: { userId },
    select: { secret: true, isEnabled: true },
  });
  if (!mfa) return err(errors.notFound("2FA 설정을 시작해 주세요"));
  if (mfa.isEnabled) return err(errors.conflict("이미 활성화되어 있어요"));

  const result = verifySync({ token: code, secret: mfa.secret });
  if (!result.valid) return err(errors.validation("인증 코드가 맞지 않아요"));

  await prisma.userMFA.update({
    where: { userId },
    data: { isEnabled: true, enabledAt: new Date() },
  });

  return ok(undefined);
}

/** 2FA 비활성화. 코드 재확인 필요. */
export async function disableMfa(userId: string, code: string): Promise<Result<void>> {
  const mfa = await prisma.userMFA.findUnique({
    where: { userId },
    select: { secret: true, isEnabled: true },
  });
  if (!mfa?.isEnabled) return err(errors.validation("2FA가 활성화되어 있지 않아요"));

  const result = verifySync({ token: code, secret: mfa.secret });
  if (!result.valid) return err(errors.validation("인증 코드가 맞지 않아요"));

  await prisma.userMFA.update({
    where: { userId },
    data: { isEnabled: false, enabledAt: null },
  });

  return ok(undefined);
}

/**
 * 로그인 시 TOTP 검증. userId 기준.
 * MFA 미설정/비활성 → true (통과). 활성화된 경우에만 code 검증.
 */
export async function verifyMfaCode(userId: string, code: string | undefined): Promise<boolean> {
  const mfa = await prisma.userMFA.findUnique({
    where: { userId },
    select: { secret: true, isEnabled: true },
  });
  if (!mfa?.isEnabled) return true;
  if (!code) return false;
  return verifySync({ token: code, secret: mfa.secret }).valid;
}

/** 회사 2FA 정책 적용 여부 확인. */
export async function isMfaRequiredForCompany(companyId: string): Promise<boolean> {
  const policy = await prisma.companySecurityPolicy.findUnique({
    where: { companyId },
    select: { mfaEnabled: true },
  });
  return policy?.mfaEnabled ?? false;
}
