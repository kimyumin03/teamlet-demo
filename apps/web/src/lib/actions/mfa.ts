"use server";

import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { generateMfaSecret, enableMfa, disableMfa, getMfaStatus } from "@teamlet/modules/security";
import { toApiResponse, type ApiResponse } from "@teamlet/shared";
import type { MfaStatus } from "@teamlet/modules/security";

async function requireUser(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

export async function getMfaStatusAction(): Promise<ApiResponse<MfaStatus>> {
  const userId = await requireUser();
  return { ok: true, data: await getMfaStatus(userId) };
}

export async function generateMfaSecretAction(): Promise<
  ApiResponse<{ secret: string; qrDataUrl: string }>
> {
  const userId = await requireUser();
  const result = await generateMfaSecret(userId);
  if (!result.ok) return result;

  const qrDataUrl = await QRCode.toDataURL(result.data.otpauthUrl);
  return { ok: true, data: { secret: result.data.secret, qrDataUrl } };
}

export async function enableMfaAction(code: string): Promise<ApiResponse<void>> {
  const userId = await requireUser();
  return toApiResponse(await enableMfa(userId, code));
}

export async function disableMfaAction(code: string): Promise<ApiResponse<void>> {
  const userId = await requireUser();
  return toApiResponse(await disableMfa(userId, code));
}
