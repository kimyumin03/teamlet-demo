import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/forms/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/home");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">로그인</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Teamlet 계정으로 로그인하세요.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
