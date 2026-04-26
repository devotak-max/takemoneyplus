import { NextResponse } from "next/server";
import { z } from "zod";
import db from "@/lib/db";

export const runtime = "nodejs";

const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "ARS"] as const;

const schema = z.object({
  email: z.string().email().max(254),
  role: z.enum(["buyer", "seller", "both"]),
  currency: z.enum(SUPPORTED_CURRENCIES),
  city: z.string().min(2).max(80),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { email, role, currency, city } = parsed.data;

  try {
    db.prepare(
      "INSERT INTO waitlist (email, role, currency, city) VALUES (?, ?, ?, ?)",
    ).run(email.toLowerCase(), role, currency, city.trim());
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE")) {
      return NextResponse.json({ ok: true, alreadyRegistered: true });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
