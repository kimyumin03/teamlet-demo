"use server";

import { writeFile } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";
import { redirect } from "next/navigation";
import {
  submitJoinByCode,
  submitCompanyApplication,
} from "@teamlet/modules/tenancy";
import { auth } from "@/auth";

export type ActionState = { error: string | null };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

async function saveApplicationDocument(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const filename = `${randomBytes(16).toString("hex")}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "applications");
  const filePath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);
  return `/uploads/applications/${filename}`;
}

/** 회사코드로 가입 신청 (docs/06 §1.2 옵션 2) */
export async function joinByCodeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const result = await submitJoinByCode(userId, {
    companyCode: String(formData.get("companyCode") ?? ""),
    memo: String(formData.get("memo") ?? "") || undefined,
  });
  if (!result.ok) return { error: result.error.message };
  redirect("/pending-approval");
}

/** 회사 등록 신청 (docs/06 §1.2 register-company) */
export async function companyApplicationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();

  let documentUrl: string | undefined;
  const docFile = formData.get("document");
  if (docFile instanceof File && docFile.size > 0) {
    if (!ALLOWED_MIME.has(docFile.type)) {
      return { error: "PDF, JPG, PNG, WEBP 파일만 업로드할 수 있어요" };
    }
    if (docFile.size > MAX_SIZE) {
      return { error: "파일 크기는 10MB 이하여야 해요" };
    }
    try {
      documentUrl = await saveApplicationDocument(docFile);
    } catch {
      return { error: "파일 업로드에 실패했어요. 다시 시도해 주세요." };
    }
  }

  const result = await submitCompanyApplication(userId, {
    companyName: String(formData.get("companyName") ?? ""),
    businessNumber: String(formData.get("businessNumber") ?? ""),
    representativeName: String(formData.get("representativeName") ?? ""),
    contact: String(formData.get("contact") ?? ""),
    companySize: String(
      formData.get("companySize") ?? "1-10",
    ) as "1-10" | "11-50" | "51-200" | "201-1000" | "1000+",
    industry: String(formData.get("industry") ?? ""),
    memo: String(formData.get("memo") ?? "") || undefined,
    documentUrl,
  });
  if (!result.ok) return { error: result.error.message };
  redirect(result.data.autoApproved ? "/home" : "/pending-approval");
}
