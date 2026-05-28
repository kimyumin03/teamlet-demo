import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isPlatformAdminEmail } from "@/lib/platform-admin";
import { LoginForm } from "@/components/forms/login-form";
import { AuthLogo } from "@/components/auth/auth-logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  if (session?.user) {
    if (isPlatformAdminEmail(session.user.email)) redirect("/admin");
    else redirect(callbackUrl ?? "/home");
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthLogo subtitle="HR for small teams" />

      <div>
        <h2 className="text-[22px] font-bold leading-tight tracking-tight">로그인</h2>
        <p className="mt-1.5 text-[13.5px] text-foreground-muted">
          업무용 이메일과 비밀번호로 로그인하세요.
        </p>
      </div>

      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}
