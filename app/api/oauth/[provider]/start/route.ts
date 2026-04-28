import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  buildAuthUrl,
  callbackRedirectUri,
  generateState,
  isOAuthProvider,
  isProviderConfigured,
} from "@/lib/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_COOKIE = "monetheus_oauth_state";

export async function GET(request: Request, { params }: { params: { provider: string } }) {
  if (!isOAuthProvider(params.provider)) {
    return NextResponse.json({ error: "Provedor não suportado." }, { status: 400 });
  }
  if (!isProviderConfigured(params.provider)) {
    return NextResponse.json(
      { error: "Provedor não configurado neste ambiente." },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const origin = url.origin;
  const state = generateState();
  const redirectUri = callbackRedirectUri(origin, params.provider);
  const authUrl = buildAuthUrl(params.provider, redirectUri, state);
  if (!authUrl) {
    return NextResponse.json({ error: "Falha ao iniciar OAuth." }, { status: 500 });
  }

  cookies().set(STATE_COOKIE, `${params.provider}:${state}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(authUrl);
}
