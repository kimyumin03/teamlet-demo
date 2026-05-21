/**
 * 플랫폼 운영자(SaaS 운영팀) 식별 — `SYSTEM_ADMIN_EMAILS` 환경변수 기반.
 *
 * 회사별 권한(RBAC)과 별개 층위. 환경변수에 등록된 이메일의 로그인 사용자만
 * `/admin` 콘솔에 접근할 수 있다.
 */

import { redirect } from "next/navigation";
import { prisma } from "@teamlet/db";
import { auth } from "@/auth";

/** `SYSTEM_ADMIN_EMAILS` (쉼표 구분) → 소문자 이메일 배열 */
export function getPlatformAdminEmails(): string[] {
  return (process.env.SYSTEM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getPlatformAdminEmails().includes(email.trim().toLowerCase());
}

export type PlatformAdmin = { userId: string; email: string; name: string };

/**
 * 플랫폼 관리자 세션 보장. 미로그인 → /login, 비관리자 → /home 으로 redirect.
 * `/admin` 레이아웃·페이지·서버액션 진입 시 호출.
 */
export async function requirePlatformAdmin(): Promise<PlatformAdmin> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true },
  });
  if (!user || !isPlatformAdminEmail(user.email)) {
    redirect("/home");
  }

  return { userId: user.id, email: user.email, name: user.name };
}
