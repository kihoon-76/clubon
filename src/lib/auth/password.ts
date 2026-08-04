import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * 비밀번호 해시. scrypt(N=16384) + 랜덤 솔트.
 * 저장 형식: `scrypt$<saltHex>$<hashHex>`
 *
 * Supabase Auth를 붙이면 이 모듈은 사용되지 않습니다(인증은 Supabase가 담당).
 * 현재는 자체 이메일/비밀번호 인증에 사용합니다.
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(plain.normalize("NFKC"), salt, KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  plain: string,
  stored: string | null,
): Promise<boolean> {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const derived = await scryptAsync(
    plain.normalize("NFKC"),
    Buffer.from(saltHex, "hex"),
    expected.length,
  );
  // 길이가 다르면 timingSafeEqual이 던지므로 먼저 확인합니다.
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
