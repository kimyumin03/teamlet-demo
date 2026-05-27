import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TwoFaForm } from "./_components/two-fa-form";

export default async function TwoFaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.mfaPending) redirect("/home");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">2단계 인증</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          인증 앱의 6자리 코드를 입력해 주세요.
        </p>
      </div>
      <TwoFaForm />
    </div>
  );
}
