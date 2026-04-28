import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMatchForUser, closeMatch } from "@/lib/matches";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const matchId = Number(params.id);
  if (!Number.isFinite(matchId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }
  const match = getMatchForUser(matchId, user.id);
  if (!match) return NextResponse.json({ error: "Match não encontrado." }, { status: 404 });
  return NextResponse.json({ match });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const matchId = Number(params.id);
  if (!Number.isFinite(matchId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }
  const ok = closeMatch(matchId, user.id);
  if (!ok) return NextResponse.json({ error: "Match não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
