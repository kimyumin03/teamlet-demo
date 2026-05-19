/**
 * 회원가입 (docs/06 §1.2). User = 인증 단위 (회사 무관).
 */
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

export async function createUserAccount(
  raw: SignupInput,
  ctx: SignupContext = {},
): Promise<Result<{ userId: string }>> {
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return err(errors.validation(parsed.error.issues[0]?.message ?? "입력 오류"));
  }
  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return err(errors.conflict("이미 가입된 이메일이에요"));
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash },
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

  return ok({ userId: user.id });
}
