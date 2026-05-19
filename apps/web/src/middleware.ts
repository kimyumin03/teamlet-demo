import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * 인증 미들웨어 (edge-safe). 회사 컨텍스트 주입은 Phase 2 (멀티 테넌시 라우팅).
 */
export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  // _next 정적/이미지/파비콘 제외 전 경로
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
