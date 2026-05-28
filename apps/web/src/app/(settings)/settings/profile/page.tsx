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
    <>
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.02em] leading-[1.2] mb-1.5 text-[var(--fg)]">프로필</h1>
          <div className="text-[13px] text-[var(--fg-muted)]">기본 정보와 연락처를 관리합니다 · 본인 정보 변경 권한</div>
        </div>
      </div>

      {/* 프로필 사진 */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] px-6 py-5 mb-4">
        <h3 className="text-[15px] font-bold mb-1.5">프로필 사진</h3>
        <div className="text-[12.5px] text-[var(--fg-muted)] mb-4">프로필 사진은 동료들에게 표시됩니다.</div>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full grid place-items-center font-bold text-[18px] shrink-0"
            style={{ background: "var(--primary)", color: "var(--primary-on)" }}
          >
            {initials}
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <button type="button" disabled className="btn btn-outline btn-sm opacity-50 cursor-not-allowed">이미지 업로드</button>
            </div>
            <div className="text-[11.5px] text-[var(--fg-muted)]">JPG, PNG · 최대 2MB · 준비 중</div>
          </div>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] px-6 py-5 mb-4">
        <h3 className="text-[15px] font-bold mb-1.5">기본 정보</h3>
        <div className="text-[12.5px] text-[var(--fg-muted)] mb-4">이름·연락처 변경은 저장 버튼을 누르면 반영됩니다.</div>
        <ProfileForm name={profile.name} phone={profile.phone} email={profile.email} />
      </div>

      {/* 보안 (2FA) */}
      <MfaSetupSection initial={mfaStatus} />
    </>
  );
}
