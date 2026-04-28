import { randomBytes } from "node:crypto";

export type OAuthProvider = "google" | "facebook";

type ProviderConfig = {
  authUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  scope: string;
  clientId: string | undefined;
  clientSecret: string | undefined;
  parseUser: (raw: any) => { id: string; email: string; name: string } | null;
};

const PROVIDERS: Record<OAuthProvider, ProviderConfig> = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userinfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    parseUser: (raw) => {
      if (!raw?.sub || !raw?.email) return null;
      return {
        id: String(raw.sub),
        email: String(raw.email),
        name: String(raw.name ?? raw.email.split("@")[0]),
      };
    },
  },
  facebook: {
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    userinfoUrl: "https://graph.facebook.com/me?fields=id,name,email",
    scope: "email,public_profile",
    clientId: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    parseUser: (raw) => {
      if (!raw?.id || !raw?.email) return null;
      return {
        id: String(raw.id),
        email: String(raw.email),
        name: String(raw.name ?? raw.email.split("@")[0]),
      };
    },
  },
};

export function isOAuthProvider(value: string): value is OAuthProvider {
  return value === "google" || value === "facebook";
}

export function isProviderConfigured(provider: OAuthProvider): boolean {
  const cfg = PROVIDERS[provider];
  return !!(cfg.clientId && cfg.clientSecret);
}

export function generateState(): string {
  return randomBytes(24).toString("hex");
}

export function buildAuthUrl(
  provider: OAuthProvider,
  redirectUri: string,
  state: string,
): string | null {
  const cfg = PROVIDERS[provider];
  if (!cfg.clientId) return null;
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: cfg.scope,
    state,
  });
  return `${cfg.authUrl}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string,
  redirectUri: string,
): Promise<string | null> {
  const cfg = PROVIDERS[provider];
  if (!cfg.clientId || !cfg.clientSecret) return null;
  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

export async function fetchOauthUser(
  provider: OAuthProvider,
  accessToken: string,
): Promise<{ id: string; email: string; name: string } | null> {
  const cfg = PROVIDERS[provider];
  const res = await fetch(cfg.userinfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return cfg.parseUser(json);
}

export function callbackRedirectUri(origin: string, provider: OAuthProvider): string {
  return `${origin}/api/oauth/${provider}/callback`;
}
