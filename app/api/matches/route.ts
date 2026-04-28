import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listMatches } from "@/lib/matches";

export const runtime = "nodejs";

export async function GET() {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  return NextResponse.json({ matches: listMatches(user.id) });
}
