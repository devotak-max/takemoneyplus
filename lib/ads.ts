import db from "./db";
import { haversineKm } from "./geo";
import { type Currency, MAX_SPREAD_PCT } from "./cap";
import { getLatestRate } from "./ptax";

const AD_TTL_MS = 24 * 60 * 60 * 1000;
const RENEWAL_ACTIVITY_WINDOW_MS = 72 * 60 * 60 * 1000;

export type Ad = {
  id: number;
  userId: number;
  currency: Currency;
  amount: number;
  unitPriceBrl: number;
  spreadPct: number;
  rateDate: string | null;
  city: string;
  lat: number;
  lng: number;
  status: "active" | "paused" | "completed";
  validUntil: string;
  lastRenewedAt: string | null;
  createdAt: string;
};

export type AdWithSeller = Ad & {
  sellerName: string;
  sellerInitials: string;
  distanceKm: number | null;
};

type AdRow = {
  id: number;
  user_id: number;
  currency: string;
  amount: number;
  unit_price_brl: number;
  spread_pct: number;
  rate_date: string | null;
  city: string;
  lat: number;
  lng: number;
  status: string;
  valid_until: string;
  last_renewed_at: string | null;
  created_at: string;
  full_name?: string;
};

function rowToAd(row: AdRow): Ad {
  return {
    id: row.id,
    userId: row.user_id,
    currency: row.currency as Currency,
    amount: row.amount,
    unitPriceBrl: row.unit_price_brl,
    spreadPct: row.spread_pct ?? 0,
    rateDate: row.rate_date,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    status: row.status as Ad["status"],
    validUntil: row.valid_until,
    lastRenewedAt: row.last_renewed_at,
    createdAt: row.created_at,
  };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function priceFromPtax(currency: Currency, spreadPct: number): {
  unitPriceBrl: number;
  rateDate: string;
} | null {
  const rate = getLatestRate(currency);
  if (!rate) return null;
  const clamped = Math.max(-MAX_SPREAD_PCT, Math.min(MAX_SPREAD_PCT, spreadPct));
  const unit = rate.rateSell * (1 + clamped);
  return { unitPriceBrl: Math.round(unit * 10000) / 10000, rateDate: rate.rateDate };
}

export function createAd(input: {
  userId: number;
  currency: Currency;
  amount: number;
  spreadPct: number;
  city: string;
  lat: number;
  lng: number;
}): Ad | { error: "no_rate" } {
  const priced = priceFromPtax(input.currency, input.spreadPct);
  if (!priced) return { error: "no_rate" };
  const validUntil = new Date(Date.now() + AD_TTL_MS).toISOString();
  const result = db
    .prepare(
      `INSERT INTO ads
        (user_id, currency, amount, unit_price_brl, spread_pct, rate_date, city, lat, lng, valid_until, last_renewed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    )
    .run(
      input.userId,
      input.currency,
      input.amount,
      priced.unitPriceBrl,
      input.spreadPct,
      priced.rateDate,
      input.city.trim(),
      input.lat,
      input.lng,
      validUntil,
    );
  const id = Number(result.lastInsertRowid);
  return getAdById(id) as Ad;
}

export function getAdById(id: number): Ad | null {
  const row = db
    .prepare(
      `SELECT id, user_id, currency, amount, unit_price_brl, spread_pct, rate_date,
              city, lat, lng, status, valid_until, last_renewed_at, created_at
       FROM ads WHERE id = ?`,
    )
    .get(id) as AdRow | undefined;
  return row ? rowToAd(row) : null;
}

export function listMyAds(userId: number): (Ad & { interestCount: number })[] {
  const rows = db
    .prepare(
      `SELECT a.id, a.user_id, a.currency, a.amount, a.unit_price_brl, a.spread_pct, a.rate_date,
              a.city, a.lat, a.lng, a.status, a.valid_until, a.last_renewed_at, a.created_at,
              (SELECT COUNT(*) FROM interests i WHERE i.ad_id = a.id AND i.action = 'like') AS interest_count
       FROM ads a
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC`,
    )
    .all(userId) as (AdRow & { interest_count: number })[];
  return rows.map((row) => ({ ...rowToAd(row), interestCount: row.interest_count }));
}

export function deleteAd(id: number, userId: number): boolean {
  const result = db.prepare("DELETE FROM ads WHERE id = ? AND user_id = ?").run(id, userId);
  return result.changes > 0;
}

export function discoverAds(input: {
  viewerId: number;
  currency?: Currency;
  origin: { lat: number; lng: number };
  radiusKm?: number;
  limit?: number;
}): AdWithSeller[] {
  const params: unknown[] = [input.viewerId];
  let where = `a.status = 'active'
    AND a.valid_until > datetime('now')
    AND a.user_id != ?
    AND NOT EXISTS (SELECT 1 FROM interests i WHERE i.ad_id = a.id AND i.user_id = ?)`;
  params.push(input.viewerId);

  if (input.currency) {
    where += " AND a.currency = ?";
    params.push(input.currency);
  }

  const rows = db
    .prepare(
      `SELECT a.id, a.user_id, a.currency, a.amount, a.unit_price_brl, a.spread_pct, a.rate_date,
              a.city, a.lat, a.lng, a.status, a.valid_until, a.last_renewed_at, a.created_at, u.full_name
       FROM ads a
       JOIN users u ON u.id = a.user_id
       WHERE ${where}
       ORDER BY a.created_at DESC
       LIMIT 200`,
    )
    .all(...params) as AdRow[];

  const enriched: AdWithSeller[] = rows.map((row) => {
    const ad = rowToAd(row);
    const distance = haversineKm(input.origin, { lat: ad.lat, lng: ad.lng });
    return {
      ...ad,
      sellerName: row.full_name ?? "",
      sellerInitials: initials(row.full_name ?? ""),
      distanceKm: distance,
    };
  });

  const filtered = input.radiusKm
    ? enriched.filter((ad) => (ad.distanceKm ?? Infinity) <= input.radiusKm!)
    : enriched;

  filtered.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  return filtered.slice(0, input.limit ?? 20);
}

export function recordInterest(input: {
  adId: number;
  userId: number;
  action: "like" | "skip";
}): { ok: boolean; matchId?: number; reason?: "self" | "unknown" } {
  const ad = getAdById(input.adId);
  if (!ad) return { ok: false, reason: "unknown" };
  if (ad.userId === input.userId) return { ok: false, reason: "self" };
  db.prepare(
    `INSERT INTO interests (ad_id, user_id, action) VALUES (?, ?, ?)
     ON CONFLICT (ad_id, user_id) DO UPDATE SET action = excluded.action, created_at = datetime('now')`,
  ).run(input.adId, input.userId, input.action);

  if (input.action === "like") {
    const existing = db
      .prepare(`SELECT id FROM matches WHERE ad_id = ? AND buyer_id = ?`)
      .get(input.adId, input.userId) as { id: number } | undefined;
    if (existing) return { ok: true, matchId: existing.id };
    const result = db
      .prepare(
        `INSERT INTO matches (ad_id, buyer_id, seller_id) VALUES (?, ?, ?)`,
      )
      .run(input.adId, input.userId, ad.userId);
    return { ok: true, matchId: Number(result.lastInsertRowid) };
  }
  return { ok: true };
}

export function listInterestedUsers(
  adId: number,
  ownerId: number,
): { id: number; name: string; phone: string; createdAt: string }[] {
  const ad = getAdById(adId);
  if (!ad || ad.userId !== ownerId) return [];
  const rows = db
    .prepare(
      `SELECT u.id, u.full_name, u.phone, i.created_at
       FROM interests i
       JOIN users u ON u.id = i.user_id
       WHERE i.ad_id = ? AND i.action = 'like'
       ORDER BY i.created_at DESC`,
    )
    .all(adId) as { id: number; full_name: string; phone: string; created_at: string }[];
  return rows.map((r) => ({ id: r.id, name: r.full_name, phone: r.phone, createdAt: r.created_at }));
}

// Renova anúncios ativos cujos donos estiveram ativos nas últimas 72h:
//  - recalcula unit_price_brl com a PTAX mais recente (mantendo spread_pct original)
//  - estende valid_until por mais 24h
// Anúncios de usuários inativos vão expirar naturalmente.
export function renewActiveAds(): { renewed: number; expired: number } {
  const cutoff = new Date(Date.now() - RENEWAL_ACTIVITY_WINDOW_MS).toISOString();
  const candidates = db
    .prepare(
      `SELECT a.id, a.currency, a.spread_pct
       FROM ads a
       JOIN users u ON u.id = a.user_id
       WHERE a.status = 'active'
         AND (u.last_seen_at IS NOT NULL AND u.last_seen_at >= ?)`,
    )
    .all(cutoff) as { id: number; currency: string; spread_pct: number }[];

  let renewed = 0;
  for (const row of candidates) {
    const priced = priceFromPtax(row.currency as Currency, row.spread_pct ?? 0);
    if (!priced) continue;
    const validUntil = new Date(Date.now() + AD_TTL_MS).toISOString();
    db.prepare(
      `UPDATE ads
       SET unit_price_brl = ?, rate_date = ?, valid_until = ?, last_renewed_at = datetime('now')
       WHERE id = ? AND status = 'active'`,
    ).run(priced.unitPriceBrl, priced.rateDate, validUntil, row.id);
    renewed++;
  }

  // Pausa anúncios cujos donos sumiram (>72h) e o anúncio expirou.
  const expired = db
    .prepare(
      `UPDATE ads SET status = 'paused'
       WHERE status = 'active' AND valid_until <= datetime('now')`,
    )
    .run().changes;

  return { renewed, expired };
}
