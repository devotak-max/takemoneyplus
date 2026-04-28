import { NextResponse } from "next/server";
import {
  createSession,
  findUserByEmail,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { LoginSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 422 });
  }

  const user = findUserByEmail(parsed.data.email);
  if (!user || !user.passwordHash || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  const session = createSession(user.id);
  setSessionCookie(session.token, session.expiresAt);
  return NextResponse.json({ ok: true });
}
