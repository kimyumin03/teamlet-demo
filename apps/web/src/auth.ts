import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authenticateUser } from "@teamlet/modules/auth";
import { findOrCreateGoogleUser } from "@teamlet/modules/auth";
import { resolveLoginContext } from "@teamlet/modules/tenancy";
import { authConfig } from "./auth.config";

/**
 * Auth.js v5 — Credentials + Google OAuth.
 * Node 런타임에서만 사용 (Prisma 의존). middleware 는 auth.config 사용.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    jwt: async ({ token, user, account, profile }) => {
      // Credentials 로그인: authorize() 에서 이미 companyId/employeeId 포함
      if (user && account?.provider === "credentials") {
        token.userId = user.id;
        token.companyId = (user as Record<string, unknown>).companyId as string | null ?? null;
        token.employeeId = (user as Record<string, unknown>).employeeId as string | null ?? null;
      }

      // Google 로그인: DB 사용자 찾거나 생성 후 컨텍스트 결정
      if (account?.provider === "google" && profile?.email) {
        const result = await findOrCreateGoogleUser({
          googleId: account.providerAccountId,
          email: profile.email as string,
          name: (profile.name as string | undefined) ?? (profile.email as string),
        });
        token.userId = result.userId;
        const ctx = await resolveLoginContext(result.userId);
        token.companyId = ctx?.companyId ?? null;
        token.employeeId = ctx?.employeeId ?? null;
      }

      // 토큰 갱신 시: employeeId 미확정 사용자(가입 대기 등) 재시도
      if (!user && !account) {
        const userId = token.userId;
        if (typeof userId === "string" && !token.employeeId) {
          const ctx = await resolveLoginContext(userId);
          if (ctx) {
            token.companyId = ctx.companyId;
            token.employeeId = ctx.employeeId;
          }
        }
      }

      return token;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "");
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        const user = await authenticateUser(email, password);
        if (!user) return null;
        const ctx = await resolveLoginContext(user.id);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          companyId: ctx?.companyId ?? null,
          employeeId: ctx?.employeeId ?? null,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
});
