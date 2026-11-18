import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no 0/o/1/l/i
export function storyId(): string {
  const b = randomBytes(10); let s = "";
  for (let i = 0; i < 10; i++) s += ALPHABET[b[i] % ALPHABET.length];
  return s;
}
export const keeperSecret = () => randomBytes(24).toString("base64url");
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
/**
 * The visitor's address, from the one place that knows it. Railway's public edge sets X-Real-IP and replaces any
 * X-Real-IP or X-Forwarded-For the visitor sent (Railway staff, Oct 2026: "use X-Real-IP for rate limiting"); the first
 * X-Forwarded-For entry is the fallback. Only ever stored as ipHash.
 */
export const clientIp = (req: Request) => req.headers.get("x-real-ip")?.trim() || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
export const ipHash = (req: Request) => sha256(clientIp(req) + salt()).slice(0, 32);
/** Production never starts without MEITHEAL_SALT (scripts/check-env.mjs): with a known salt these fingerprints can be reversed. */
const salt = () => process.env.MEITHEAL_SALT ?? (process.env.NODE_ENV === "production" ? (() => { throw new Error("MEITHEAL_SALT is not set"); })() : "dev-only-salt");
/** The setup key. Compared in constant time (as hashes, so the lengths match). An unset ADMIN_KEY lets nobody in. */
export const adminOk = (key: string | null | undefined) => !!process.env.ADMIN_KEY && typeof key === "string" && key.length > 0 && timingSafeEqual(createHash("sha256").update(key).digest(), createHash("sha256").update(process.env.ADMIN_KEY).digest());
