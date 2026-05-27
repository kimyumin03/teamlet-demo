import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isPlatformAdminEmail } from "@/lib/platform-admin";
import { LoginForm } from "@/components/forms/login-form";

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
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">로그인</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Teamlet 계정으로 로그인하세요.
        </p>
      </div>
      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}
