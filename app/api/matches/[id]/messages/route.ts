import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listMessages, sendMessage } from "@/lib/matches";
import { SendMessageSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const matchId = Number(params.id);
  if (!Number.isFinite(matchId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }
  const url = new URL(request.url);
  const afterRaw = url.searchParams.get("after");
  const afterId = afterRaw ? Number(afterRaw) : undefined;
  const messages = listMessages(matchId, user.id, afterId);
  return NextResponse.json({ messages });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const matchId = Number(params.id);
  if (!Number.isFinite(matchId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = SendMessageSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Mensagem inválida." }, { status: 422 });
  }

  const message = sendMessage(matchId, user.id, parsed.data.body);
  if (!message) {
    return NextResponse.json(
      { error: "Match não encontrado ou encerrado." },
      { status: 404 },
    );
  }
  return NextResponse.json({ message });
}
