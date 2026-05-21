import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignupForm } from "@/components/forms/signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  if (session?.user) redirect(callbackUrl ?? "/home");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">회원가입</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          계정을 만들고 회사에 가입하세요.
        </p>
      </div>
      <SignupForm callbackUrl={callbackUrl} />
    </div>
  );
}
