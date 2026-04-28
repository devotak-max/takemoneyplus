import { NextResponse } from "next/server";
import { getCurrentUser, updateUserLocation } from "@/lib/auth";
import { createAd, discoverAds, renewActiveAds } from "@/lib/ads";
import { MAX_AMOUNT_PER_CURRENCY, isSupportedCurrency } from "@/lib/cap";
import { CreateAdSchema, DiscoverQuerySchema } from "@/lib/validators";
import { FALLBACK_LOCATION } from "@/lib/geo";
import { ensureFreshRates, getAllLatestRates } from "@/lib/ptax";

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

  const parsed = CreateAdSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const data = parsed.data;
  const cap = MAX_AMOUNT_PER_CURRENCY[data.currency];
  if (data.amount > cap) {
    return NextResponse.json(
      {
        error: `Limite legal: até ${cap.toLocaleString("pt-BR")} ${data.currency} por operação (≈ USD 500).`,
      },
      { status: 422 },
    );
  }

  await ensureFreshRates();
  const ad = createAd({
    userId: user.id,
    currency: data.currency,
    amount: data.amount,
    spreadPct: data.spreadPct,
    city: data.city,
    lat: data.lat,
    lng: data.lng,
  });
  if ("error" in ad) {
    return NextResponse.json(
      { error: "Cotação PTAX indisponível no momento. Tente novamente em instantes." },
      { status: 503 },
    );
  }
  updateUserLocation(user.id, data.lat, data.lng);
  return NextResponse.json({ ok: true, ad });
}

export async function GET(request: Request) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const parsed = DiscoverQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 422 });
  }

  await ensureFreshRates();
  renewActiveAds();

  const origin =
    parsed.data.lat !== undefined && parsed.data.lng !== undefined
      ? { lat: parsed.data.lat, lng: parsed.data.lng }
      : user.lastLat !== null && user.lastLng !== null
        ? { lat: user.lastLat, lng: user.lastLng }
        : FALLBACK_LOCATION;

  if (parsed.data.lat !== undefined && parsed.data.lng !== undefined) {
    updateUserLocation(user.id, parsed.data.lat, parsed.data.lng);
  }

  const ads = discoverAds({
    viewerId: user.id,
    currency: parsed.data.currency,
    origin,
    radiusKm: parsed.data.radiusKm,
    limit: parsed.data.limit,
  });

  return NextResponse.json({
    ads,
    origin,
    caps: MAX_AMOUNT_PER_CURRENCY,
    rates: getAllLatestRates(),
    currency: parsed.data.currency && isSupportedCurrency(parsed.data.currency) ? parsed.data.currency : null,
  });
}
