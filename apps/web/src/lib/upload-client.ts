"use client";

/**
 * 클라이언트 파일 업로드 헬퍼 — `/api/uploads` 로 multipart POST.
 * 로고/프로필/문서/이력서/증명서 등 여러 업로드 UI 에서 재사용.
 */
export type UploadScope =
  | "company-documents"
  | "logos"
  | "profiles"
  | "certificates"
  | "resumes"
  | "employee-documents";

export type UploadResult =
  | { ok: true; url: string; name: string; size: number }
  | { ok: false; error: string };

export async function uploadFile(file: File, scope: UploadScope): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("scope", scope);

  let res: Response;
  try {
    res = await fetch("/api/uploads", { method: "POST", body: form });
  } catch {
    return { ok: false, error: "네트워크 오류로 업로드에 실패했어요" };
  }

  const data = (await res.json().catch(() => null)) as UploadResult | null;
  if (!data) return { ok: false, error: "업로드 응답을 해석할 수 없어요" };
  return data;
}
