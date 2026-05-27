/**
 * 회원가입 (docs/06 §1.2). User = 인증 단위 (회사 무관).
 */
import { randomBytes } from "crypto";
import { prisma } from "@teamlet/db";
import {
  signupSchema,
  type SignupInput,
  type Result,
  ok,
  err,
  errors,
} from "@teamlet/shared";
import { hashPassword } from "./password";
import { recordAudit } from "../audit/index";

export type SignupContext = { ip?: string | null; userAgent?: string | null };

function generateTempPassword(): string {
  // 영문+숫자+특수 조건 충족하는 임시 비밀번호 생성
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const specials = "!@#$%^&*";
  const all = letters + digits + specials;
  const bytes = randomBytes(17);
  let body = "";
  for (const byte of bytes) body += all[byte % all.length];
  const r = randomBytes(3);
  return (
    letters[r[0]! % letters.length]! +
    digits[r[1]! % digits.length]! +
    specials[r[2]! % specials.length]! +
    body
  );
}

export async function createUserAccount(
  raw: SignupInput,
  ctx: SignupContext = {},
): Promise<Result<{ userId: string; tempPassword: string }>> {
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return err(errors.validation(parsed.error.issues[0]?.message ?? "입력 오류"));
  }
  const { name, email, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return err(errors.conflict("이미 가입된 이메일이에요"));
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, emailVerified: true },
  });

  await recordAudit({
    actorUserId: user.id,
    actorEmail: email,
    actorName: name,
    activityType: "auth",
    eventType: "CREATE",
    targetType: "User",
    targetId: user.id,
    targetLabel: email,
    description: "회원가입",
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return ok({ userId: user.id, tempPassword });
}
