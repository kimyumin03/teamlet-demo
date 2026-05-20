import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authenticateUser } from "@teamlet/modules/auth";
import { resolveLoginContext } from "@teamlet/modules/tenancy";
import { authConfig } from "./auth.config";

/**
 * Auth.js v5 — Credentials (자체 비밀번호 정책, docs/04 §1).
 * Node 런타임에서만 사용 (Prisma 의존). middleware 는 auth.config 사용.
 *
 * 로그인 시점에 활성 membership 1개에서 currentCompanyId/employeeId 를 derive
 * 해서 user 객체에 담아 JWT 콜백으로 전달 (auth.config 가 token/session 에 보존).
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // Node 런타임 override — Prisma 의존 가능. authConfig 의 edge-safe jwt 를 대체.
    jwt: async ({ token, user }) => {
      if (user) {
        token.userId = user.id;
        token.companyId = user.companyId ?? null;
        token.employeeId = user.employeeId ?? null;
      }
      // 멤버십 미확정 사용자(가입 대기 / 자가-승인 직후) 는 매 요청 시 derive 재시도 →
      // 활성화되는 순간 다음 요청에서 token 에 employeeId 자동 반영.
      const userId = token.userId;
      if (typeof userId === "string" && !token.employeeId) {
        const ctx = await resolveLoginContext(userId);
        if (ctx) {
          token.companyId = ctx.companyId;
          token.employeeId = ctx.employeeId;
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
  ],
});
