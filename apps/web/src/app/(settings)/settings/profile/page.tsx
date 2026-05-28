import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserProfile } from "@teamlet/modules/auth";
import { ProfileForm } from "@/components/settings/profile-form";
import { MfaSetupSection } from "@/components/settings/mfa-setup-section";
import { getMfaStatus } from "@teamlet/modules/security";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [result, mfaStatus] = await Promise.all([
    getUserProfile(session.user.id),
    getMfaStatus(session.user.id),
  ]);
  if (!result.ok) redirect("/home");

  const profile = result.data;
  const initials = (profile.name ?? "?")
    .split(" ")
    .map((w: string) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">프로필</h1>
        <p className="mt-0.5 text-[13px] text-foreground-muted">기본 정보와 연락처를 관리해요</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* 프로필 사진 카드 */}
        <div className="rounded-[14px] border border-border bg-background-primary px-[26px] py-[22px]">
          <h3 className="mb-1.5 text-[15px] font-bold text-foreground">프로필 사진</h3>
          <p className="mb-4 text-[12.5px] text-foreground-muted">프로필 사진은 동료들에게 표시됩니다.</p>
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[18px] font-bold"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-hover))", color: "var(--primary-on)" }}
            >
              {initials}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled
                  className="rounded-[8px] border border-border bg-background-primary px-3 py-1.5 text-[12.5px] text-foreground-muted transition-colors hover:bg-background-secondary disabled:opacity-50"
                >
                  이미지 업로드
                </button>
              </div>
              <p className="text-[11.5px] text-foreground-subtle">JPG, PNG · 최대 2MB · 준비 중</p>
            </div>
          </div>
        </div>

        {/* 기본 정보 카드 */}
        <div className="rounded-[14px] border border-border bg-background-primary px-[26px] py-[22px]">
          <h3 className="mb-5 text-[15px] font-bold text-foreground">기본 정보</h3>
          <ProfileForm name={profile.name} phone={profile.phone} email={profile.email} />
        </div>

        {/* 보안 카드 */}
        <MfaSetupSection initial={mfaStatus} />

      </div>
    </div>
  );
}
