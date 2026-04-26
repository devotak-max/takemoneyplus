import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "monetheus_admin";
const ADMIN_TTL_HOURS = 8;

const SECRET = process.env.MONETHEUS_SECRET ?? "monetheus-dev-secret-change-me";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "monetheus-dev";

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

export function verifyAdminPassword(input: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(ADMIN_PASSWORD);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function setAdminCookie(): void {
  const expiresAt = new Date(Date.now() + ADMIN_TTL_HOURS * 60 * 60 * 1000);
  const payload = `ok.${expiresAt.getTime()}`;
  const token = `${payload}.${sign(payload)}`;
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function clearAdminCookie(): void {
  cookies().delete(ADMIN_COOKIE);
}

export function isAdminAuthenticated(): boolean {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [marker, expiresAtMs, signature] = parts;
  if (marker !== "ok") return false;
  const expiresAt = Number(expiresAtMs);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const expected = sign(`${marker}.${expiresAtMs}`);
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
