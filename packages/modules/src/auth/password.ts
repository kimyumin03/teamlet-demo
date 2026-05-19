/**
 * 비밀번호 해시 — node:crypto scrypt (네이티브 의존 없음, Windows 안전).
 * 형식: scrypt$N$<salt-hex>$<hash-hex>
 */
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;
const COST = 16384; // 2^14

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  cost: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, { N: cost }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(plain, salt, KEYLEN, COST);
  return `scrypt$${COST}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const cost = Number(parts[1]);
  const salt = Buffer.from(parts[2]!, "hex");
  const expected = Buffer.from(parts[3]!, "hex");
  const derived = await scryptAsync(plain, salt, expected.length, cost);
  return (
    derived.length === expected.length && timingSafeEqual(derived, expected)
  );
}
