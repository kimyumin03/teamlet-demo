import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignupForm } from "@/components/forms/signup-form";
import { AuthCard, AuthTitle } from "@/components/teamlet/auth-card";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  if (session?.user) redirect(callbackUrl ?? "/home");

  return (
    <AuthCard>
      <AuthTitle
        title="계정 만들기"
        sub="5초면 시작할 수 있어요. 회사는 다음 단계에서 선택합니다."
      />
      <SignupForm callbackUrl={callbackUrl} />
    </AuthCard>
  );
}
