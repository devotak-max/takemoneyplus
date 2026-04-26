import { NextResponse } from "next/server";
import {
  createSession,
  createUser,
  findUserByEmail,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import { SignupSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = SignupSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const data = parsed.data;
  if (findUserByEmail(data.email)) {
    return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });
  }

  try {
    const user = createUser({
      email: data.email,
      passwordHash: hashPassword(data.password),
      fullName: data.fullName,
      cpf: data.cpf,
      phone: data.phone,
      city: data.city,
    });
    const session = createSession(user.id);
    setSessionCookie(session.token, session.expiresAt);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "CPF ou e-mail já cadastrado." }, { status: 409 });
    }
    throw err;
  }
}
