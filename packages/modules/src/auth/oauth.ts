import { prisma } from "@teamlet/db";

export type GoogleUserResult = { userId: string; isNew: boolean };

export async function findOrCreateGoogleUser({
  googleId,
  email,
  name,
}: {
  googleId: string;
  email: string;
  name: string;
}): Promise<GoogleUserResult> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1) 이미 Google 계정으로 연결된 사용자
  const byGoogleId = await prisma.user.findUnique({ where: { googleId } });
  if (byGoogleId) return { userId: byGoogleId.id, isNew: false };

  // 2) 같은 이메일로 기존 자격증명 계정이 있으면 연결
  const byEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (byEmail) {
    await prisma.user.update({
      where: { id: byEmail.id },
      data: { googleId },
    });
    return { userId: byEmail.id, isNew: false };
  }

  // 3) 신규 사용자 — 비밀번호 없이 생성
  const created = await prisma.user.create({
    data: { email: normalizedEmail, name, googleId },
  });
  return { userId: created.id, isNew: true };
}
