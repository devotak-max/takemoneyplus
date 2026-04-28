import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import db from "./db";

export const SESSION_COOKIE = "monetheus_session";
const SESSION_TTL_DAYS = 30;

export type User = {
  id: number;
  email: string;
  fullName: string;
  cpf: string | null;
  phone: string | null;
  city: string | null;
  lastLat: number | null;
  lastLng: number | null;
};

type UserRow = {
  id: number;
  email: string;
  full_name: string;
  cpf: string | null;
  phone: string | null;
  city: string | null;
  last_lat: number | null;
  last_lng: number | null;
};

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    cpf: row.cpf,
    phone: row.phone,
    city: row.city,
    lastLat: row.last_lat,
    lastLng: row.last_lng,
  };
}

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(plain, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(plain, salt, expected.length);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function createSession(userId: number): { token: string; expiresAt: Date } {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(
    token,
    userId,
    expiresAt.toISOString(),
  );
  return { token, expiresAt };
}

export function destroySession(token: string): void {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
}

export function setSessionCookie(token: string, expiresAt: Date): void {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(): void {
  cookies().delete(SESSION_COOKIE);
}

function touchLastSeen(userId: number) {
  db.prepare("UPDATE users SET last_seen_at = datetime('now') WHERE id = ?").run(userId);
}

export function getCurrentUser(): User | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = db
    .prepare("SELECT user_id, expires_at FROM sessions WHERE id = ?")
    .get(token) as { user_id: number; expires_at: string } | undefined;
  if (!session) return null;

  if (new Date(session.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
    return null;
  }

  const row = db
    .prepare(
      "SELECT id, email, full_name, cpf, phone, city, last_lat, last_lng FROM users WHERE id = ?",
    )
    .get(session.user_id) as UserRow | undefined;
  if (!row) return null;
  touchLastSeen(row.id);
  return rowToUser(row);
}

export function findUserByEmail(email: string): (User & { passwordHash: string | null }) | null {
  const row = db
    .prepare(
      "SELECT id, email, password_hash, full_name, cpf, phone, city, last_lat, last_lng FROM users WHERE email = ?",
    )
    .get(email.toLowerCase()) as (UserRow & { password_hash: string | null }) | undefined;
  if (!row) return null;
  return { ...rowToUser(row), passwordHash: row.password_hash };
}

export function getUserById(id: number): User | null {
  const row = db
    .prepare(
      "SELECT id, email, full_name, cpf, phone, city, last_lat, last_lng FROM users WHERE id = ?",
    )
    .get(id) as UserRow | undefined;
  return row ? rowToUser(row) : null;
}

export function createUser(input: {
  email: string;
  passwordHash: string;
  fullName: string;
  cpf: string;
  phone: string;
  city: string;
}): User {
  const result = db
    .prepare(
      `INSERT INTO users (email, password_hash, full_name, cpf, phone, city)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.email.toLowerCase(),
      input.passwordHash,
      input.fullName.trim(),
      input.cpf,
      input.phone,
      input.city.trim(),
    );
  const id = Number(result.lastInsertRowid);
  return {
    id,
    email: input.email.toLowerCase(),
    fullName: input.fullName.trim(),
    cpf: input.cpf,
    phone: input.phone,
    city: input.city.trim(),
    lastLat: null,
    lastLng: null,
  };
}

export function createOauthUser(input: {
  email: string;
  fullName: string;
  provider: "google" | "facebook";
  providerAccountId: string;
}): User {
  const result = db
    .prepare(
      `INSERT INTO users (email, full_name) VALUES (?, ?)`,
    )
    .run(input.email.toLowerCase(), input.fullName.trim());
  const id = Number(result.lastInsertRowid);
  db.prepare(
    `INSERT INTO oauth_accounts (user_id, provider, provider_account_id) VALUES (?, ?, ?)`,
  ).run(id, input.provider, input.providerAccountId);
  return {
    id,
    email: input.email.toLowerCase(),
    fullName: input.fullName.trim(),
    cpf: null,
    phone: null,
    city: null,
    lastLat: null,
    lastLng: null,
  };
}

export function findOauthUser(
  provider: "google" | "facebook",
  providerAccountId: string,
): User | null {
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.full_name, u.cpf, u.phone, u.city, u.last_lat, u.last_lng
       FROM oauth_accounts o
       JOIN users u ON u.id = o.user_id
       WHERE o.provider = ? AND o.provider_account_id = ?`,
    )
    .get(provider, providerAccountId) as UserRow | undefined;
  return row ? rowToUser(row) : null;
}

export function linkOauthAccount(
  userId: number,
  provider: "google" | "facebook",
  providerAccountId: string,
): void {
  db.prepare(
    `INSERT OR IGNORE INTO oauth_accounts (user_id, provider, provider_account_id)
     VALUES (?, ?, ?)`,
  ).run(userId, provider, providerAccountId);
}

export function completeProfile(
  userId: number,
  input: { cpf: string; phone: string; city: string },
): void {
  db.prepare(
    `UPDATE users SET cpf = ?, phone = ?, city = ? WHERE id = ?`,
  ).run(input.cpf, input.phone, input.city.trim(), userId);
}

export function updateUserLocation(userId: number, lat: number, lng: number): void {
  db.prepare(
    "UPDATE users SET last_lat = ?, last_lng = ?, last_seen_at = datetime('now') WHERE id = ?",
  ).run(lat, lng, userId);
}
