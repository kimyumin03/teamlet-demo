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
      // (auth) 그룹 + 정적/인증 API 는 항상 허용
      const isPublic =
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/join-company" ||
        pathname === "/register-company" ||
        pathname === "/pending-approval" ||
        pathname.startsWith("/api/auth");
      if (isPublic) return true;
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) token.userId = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
