import db from "./db";
import type { Currency } from "./cap";

export type MatchSummary = {
  id: number;
  adId: number;
  status: "open" | "closed";
  createdAt: string;
  role: "buyer" | "seller";
  partnerName: string;
  partnerInitials: string;
  partnerPhone: string | null;
  currency: Currency;
  amount: number;
  unitPriceBrl: number;
  city: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export type Message = {
  id: number;
  matchId: number;
  senderId: number;
  body: string;
  createdAt: string;
};

export type MatchDetail = {
  id: number;
  adId: number;
  buyerId: number;
  sellerId: number;
  status: "open" | "closed";
  createdAt: string;
  ad: {
    currency: Currency;
    amount: number;
    unitPriceBrl: number;
    city: string;
  };
  partner: {
    id: number;
    name: string;
    initials: string;
    phone: string | null;
  };
  role: "buyer" | "seller";
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function listMatches(userId: number): MatchSummary[] {
  const rows = db
    .prepare(
      `SELECT m.id, m.ad_id, m.buyer_id, m.seller_id, m.status, m.created_at,
              a.currency, a.amount, a.unit_price_brl, a.city,
              partner.id AS partner_id, partner.full_name AS partner_name, partner.phone AS partner_phone,
              (SELECT body FROM messages WHERE match_id = m.id ORDER BY id DESC LIMIT 1) AS last_body,
              (SELECT created_at FROM messages WHERE match_id = m.id ORDER BY id DESC LIMIT 1) AS last_at
       FROM matches m
       JOIN ads a ON a.id = m.ad_id
       JOIN users partner ON partner.id = (CASE WHEN m.buyer_id = ? THEN m.seller_id ELSE m.buyer_id END)
       WHERE m.buyer_id = ? OR m.seller_id = ?
       ORDER BY COALESCE(last_at, m.created_at) DESC`,
    )
    .all(userId, userId, userId) as Array<{
      id: number;
      ad_id: number;
      buyer_id: number;
      seller_id: number;
      status: string;
      created_at: string;
      currency: string;
      amount: number;
      unit_price_brl: number;
      city: string;
      partner_id: number;
      partner_name: string;
      partner_phone: string | null;
      last_body: string | null;
      last_at: string | null;
    }>;

  return rows.map((r) => ({
    id: r.id,
    adId: r.ad_id,
    status: r.status as "open" | "closed",
    createdAt: r.created_at,
    role: r.buyer_id === userId ? "buyer" : "seller",
    partnerName: r.partner_name,
    partnerInitials: initials(r.partner_name),
    partnerPhone: r.partner_phone,
    currency: r.currency as Currency,
    amount: r.amount,
    unitPriceBrl: r.unit_price_brl,
    city: r.city,
    lastMessage: r.last_body,
    lastMessageAt: r.last_at,
    unreadCount: 0,
  }));
}

export function getMatchForUser(matchId: number, userId: number): MatchDetail | null {
  const row = db
    .prepare(
      `SELECT m.id, m.ad_id, m.buyer_id, m.seller_id, m.status, m.created_at,
              a.currency, a.amount, a.unit_price_brl, a.city,
              partner.id AS partner_id, partner.full_name AS partner_name, partner.phone AS partner_phone
       FROM matches m
       JOIN ads a ON a.id = m.ad_id
       JOIN users partner ON partner.id = (CASE WHEN m.buyer_id = ? THEN m.seller_id ELSE m.buyer_id END)
       WHERE m.id = ? AND (m.buyer_id = ? OR m.seller_id = ?)`,
    )
    .get(userId, matchId, userId, userId) as
    | {
        id: number;
        ad_id: number;
        buyer_id: number;
        seller_id: number;
        status: string;
        created_at: string;
        currency: string;
        amount: number;
        unit_price_brl: number;
        city: string;
        partner_id: number;
        partner_name: string;
        partner_phone: string | null;
      }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    adId: row.ad_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    status: row.status as "open" | "closed",
    createdAt: row.created_at,
    ad: {
      currency: row.currency as Currency,
      amount: row.amount,
      unitPriceBrl: row.unit_price_brl,
      city: row.city,
    },
    partner: {
      id: row.partner_id,
      name: row.partner_name,
      initials: initials(row.partner_name),
      phone: row.partner_phone,
    },
    role: row.buyer_id === userId ? "buyer" : "seller",
  };
}

export function listMessages(
  matchId: number,
  userId: number,
  afterId?: number,
): Message[] {
  // Confirma acesso primeiro.
  const access = db
    .prepare(
      `SELECT 1 AS ok FROM matches WHERE id = ? AND (buyer_id = ? OR seller_id = ?)`,
    )
    .get(matchId, userId, userId) as { ok: number } | undefined;
  if (!access) return [];

  const rows = afterId
    ? (db
        .prepare(
          `SELECT id, match_id, sender_id, body, created_at
           FROM messages WHERE match_id = ? AND id > ? ORDER BY id ASC`,
        )
        .all(matchId, afterId) as Array<{
          id: number;
          match_id: number;
          sender_id: number;
          body: string;
          created_at: string;
        }>)
    : (db
        .prepare(
          `SELECT id, match_id, sender_id, body, created_at
           FROM messages WHERE match_id = ? ORDER BY id ASC LIMIT 200`,
        )
        .all(matchId) as Array<{
          id: number;
          match_id: number;
          sender_id: number;
          body: string;
          created_at: string;
        }>);

  return rows.map((r) => ({
    id: r.id,
    matchId: r.match_id,
    senderId: r.sender_id,
    body: r.body,
    createdAt: r.created_at,
  }));
}

export function sendMessage(
  matchId: number,
  senderId: number,
  body: string,
): Message | null {
  const match = getMatchForUser(matchId, senderId);
  if (!match) return null;
  if (match.status !== "open") return null;
  const result = db
    .prepare(
      `INSERT INTO messages (match_id, sender_id, body) VALUES (?, ?, ?)`,
    )
    .run(matchId, senderId, body);
  const id = Number(result.lastInsertRowid);
  const row = db
    .prepare(
      `SELECT id, match_id, sender_id, body, created_at FROM messages WHERE id = ?`,
    )
    .get(id) as {
      id: number;
      match_id: number;
      sender_id: number;
      body: string;
      created_at: string;
    };
  return {
    id: row.id,
    matchId: row.match_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

export function closeMatch(matchId: number, userId: number): boolean {
  const result = db
    .prepare(
      `UPDATE matches SET status = 'closed'
       WHERE id = ? AND (buyer_id = ? OR seller_id = ?)`,
    )
    .run(matchId, userId, userId);
  return result.changes > 0;
}
