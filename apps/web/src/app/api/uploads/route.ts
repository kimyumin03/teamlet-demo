import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@teamlet/db";
import { auth } from "@/auth";
import { uploadObject, sanitizeFilename } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
]);

// 업로드 용도(scope) 화이트리스트 — 키 prefix 로 사용
const ALLOWED_SCOPES = new Set([
  "company-documents",
  "logos",
  "profiles",
  "certificates",
  "resumes",
  "employee-documents",
]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.employeeId) {
    return NextResponse.json({ ok: false, error: "로그인이 필요해요" }, { status: 401 });
  }

  const emp = await prisma.employee.findUnique({
    where: { id: session.user.employeeId },
    select: { companyId: true },
  });
  if (!emp) {
    return NextResponse.json({ ok: false, error: "회사 컨텍스트를 찾을 수 없어요" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청이에요" }, { status: 400 });
  }

  const file = form.get("file");
  const scopeRaw = String(form.get("scope") ?? "company-documents");
  const scope = ALLOWED_SCOPES.has(scopeRaw) ? scopeRaw : "company-documents";

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "파일이 없어요" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ ok: false, error: "빈 파일이에요" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "10MB 이하 파일만 업로드할 수 있어요" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ ok: false, error: "지원하지 않는 파일 형식이에요" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `${scope}/${emp.companyId}/${randomUUID()}-${sanitizeFilename(file.name)}`;

  try {
    const url = await uploadObject(key, buffer, file.type);
    return NextResponse.json({ ok: true, url, name: file.name, size: file.size });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "업로드 실패";
    return NextResponse.json({ ok: false, error: `업로드 실패: ${msg}` }, { status: 502 });
  }
}
