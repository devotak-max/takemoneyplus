import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  callbackRedirectUri,
  exchangeCodeForToken,
  fetchOauthUser,
  isOAuthProvider,
  isProviderConfigured,
} from "@/lib/oauth";
import {
  createOauthUser,
  createSession,
  findOauthUser,
  findUserByEmail,
  linkOauthAccount,
  setSessionCookie,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_COOKIE = "monetheus_oauth_state";

function failureRedirect(origin: string, code: string) {
  return NextResponse.redirect(`${origin}/entrar?oauth_error=${code}`);
}

export async function GET(request: Request, { params }: { params: { provider: string } }) {
  const url = new URL(request.url);
  const origin = url.origin;

  if (!isOAuthProvider(params.provider)) {
    return failureRedirect(origin, "provider");
  }
  if (!isProviderConfigured(params.provider)) {
    return failureRedirect(origin, "not_configured");
  }

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  if (!code || !returnedState) {
    return failureRedirect(origin, "missing_code");
  }

  const stored = cookies().get(STATE_COOKIE)?.value;
  cookies().delete(STATE_COOKIE);
  if (!stored) return failureRedirect(origin, "missing_state");
  const [storedProvider, storedState] = stored.split(":");
  if (storedProvider !== params.provider || storedState !== returnedState) {
    return failureRedirect(origin, "state_mismatch");
  }

  const redirectUri = callbackRedirectUri(origin, params.provider);
  const token = await exchangeCodeForToken(params.provider, code, redirectUri);
  if (!token) return failureRedirect(origin, "token_exchange");

  const profile = await fetchOauthUser(params.provider, token);
  if (!profile) return failureRedirect(origin, "userinfo");

  // 1) já existe conta vinculada por providerAccountId?
  let user = findOauthUser(params.provider, profile.id);

  // 2) não vinculada: existe usuário pelo email? -> vincular.
  if (!user) {
    const byEmail = findUserByEmail(profile.email);
    if (byEmail) {
      linkOauthAccount(byEmail.id, params.provider, profile.id);
      user = byEmail;
    }
  }

  // 3) novo usuário OAuth — cria sem CPF/telefone (a completar).
  if (!user) {
    user = createOauthUser({
      email: profile.email,
      fullName: profile.name,
      provider: params.provider,
      providerAccountId: profile.id,
    });
  }

  const session = createSession(user.id);
  setSessionCookie(session.token, session.expiresAt);

  const needsProfile = !user.cpf || !user.phone || !user.city;
  return NextResponse.redirect(
    `${origin}${needsProfile ? "/completar-cadastro" : "/descobrir"}`,
  );
}
