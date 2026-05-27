import { createHmac, timingSafeEqual } from "crypto";

const TTL_MS = 30_000;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET not set");
  return s;
}

/** TOTP 검증 후 signIn 재인증에 사용할 단기 서명 토큰 생성 (30초 TTL). */
export function signMfaToken(userId: string): string {
  const exp = Date.now() + TTL_MS;
  const payload = `${userId}:${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

/** 토큰 검증 — userId 일치 + 서명 유효 + 만료 미경과 시 true. */
export function verifyMfaToken(token: string, userId: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const lastColon = decoded.lastIndexOf(":");
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const [uid, expStr] = payload.split(":");
    if (uid !== userId) return false;
    if (Date.now() > Number(expStr)) return false;
    const expected = createHmac("sha256", secret()).update(payload).digest("hex");
    const sigBuf = Buffer.from(sig, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}
