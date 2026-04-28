import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordInterest } from "@/lib/ads";
import { InterestSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = InterestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 422 });
  }

  const result = recordInterest({
    adId: parsed.data.adId,
    userId: user.id,
    action: parsed.data.action,
  });

  if (!result.ok) {
    if (result.reason === "self") {
      return NextResponse.json({ error: "Você não pode reagir ao próprio anúncio." }, { status: 400 });
    }
    return NextResponse.json({ error: "Anúncio não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, matchId: result.matchId ?? null });
}
