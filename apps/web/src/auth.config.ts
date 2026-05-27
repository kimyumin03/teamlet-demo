import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe 기본 설정 (Prisma 비의존) — middleware 가 이걸 사용.
 * 실제 자격증명 검증(authorize)은 auth.ts 에서 Node 런타임으로 주입.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [], // auth.ts 에서 Credentials 주입
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const mfaPending = !!(auth?.user as Record<string, unknown> | undefined)?.mfaPending;

      const isPublic =
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/admin-key" ||
        pathname === "/join-company" ||
        pathname === "/register-company" ||
        pathname === "/pending-approval" ||
        pathname.startsWith("/api/auth");
      if (isPublic) return true;

      if (!isLoggedIn) return false;

      // 2FA 미완료 → /2fa 만 허용
      if (mfaPending && pathname !== "/2fa") {
        return Response.redirect(new URL("/2fa", request.nextUrl));
      }
      // 2FA 불필요한데 /2fa 접근 → 홈으로
      if (!mfaPending && pathname === "/2fa") {
        return Response.redirect(new URL("/home", request.nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.companyId = user.companyId ?? null;
        token.employeeId = user.employeeId ?? null;
        token.mfaPending = user.mfaPending ?? false;
      }
      return token;
    },
    session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId as string;
        session.user.companyId = (token.companyId as string | null) ?? null;
        session.user.employeeId = (token.employeeId as string | null) ?? null;
        session.user.mfaPending = (token.mfaPending as boolean | undefined) ?? false;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
