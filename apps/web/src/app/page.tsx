import { redirect } from "next/navigation";

/**
 * 루트 — 인증 상태에 따라 분기 (Step 5에서 세션 체크 연결).
 * 현재는 로그인으로 보냄.
 */
export default function RootPage() {
  redirect("/login");
}
