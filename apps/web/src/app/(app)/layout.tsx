import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * 로그인 후 레이아웃 (docs/05 §7-1). Phase 2 에서 Sidebar + Header + ⌘K 추가.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <div className="min-h-screen bg-background">{children}</div>;
}
