import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { findUserByEmail, authenticateUser } from "@teamlet/modules/auth";
import { findOrCreateGoogleUser } from "@teamlet/modules/auth";
import { resolveLoginContext } from "@teamlet/modules/tenancy";
import { getMfaStatus } from "@teamlet/modules/security";
import { isPlatformAdminEmail } from "@/lib/platform-admin";
import { verifyMfaToken } from "@/lib/mfa-token";
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
        token.mfaPending = (user as Record<string, unknown>).mfaPending as boolean ?? false;
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
        adminKey: { label: "관리자 비밀키", type: "password" },
        mfaToken: { label: "MFA 토큰", type: "text" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "").trim();
        const password = String(credentials?.password ?? "").trim();
        const adminKey = String(credentials?.adminKey ?? "").trim();
        const mfaToken = String(credentials?.mfaToken ?? "").trim();
        if (!email) return null;

        // TOTP 검증 완료 후 재인증 경로 — 서명된 단기 토큰으로 mfaPending 해제
        if (mfaToken) {
          const user = await findUserByEmail(email);
          if (!user) return null;
          if (!verifyMfaToken(mfaToken, user.id)) return null;
          const ctx = await resolveLoginContext(user.id);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            companyId: ctx?.companyId ?? null,
            employeeId: ctx?.employeeId ?? null,
            mfaPending: false,
          };
        }

        // 플랫폼 관리자 비밀키 경로
        if (isPlatformAdminEmail(email)) {
          const secret = process.env.PLATFORM_ADMIN_SECRET;
          if (!secret || adminKey !== secret) return null;
          const user = await findUserByEmail(email);
          if (!user) return null;
          const ctx = await resolveLoginContext(user.id);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            companyId: ctx?.companyId ?? null,
            employeeId: ctx?.employeeId ?? null,
            mfaPending: false,
          };
        }

        // 일반 이메일+비밀번호 로그인
        const user = await authenticateUser(email, password);
        if (!user) return null;

        const [ctx, mfaStatus] = await Promise.all([
          resolveLoginContext(user.id),
          getMfaStatus(user.id),
        ]);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          companyId: ctx?.companyId ?? null,
          employeeId: ctx?.employeeId ?? null,
          mfaPending: mfaStatus.isEnabled,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
});
