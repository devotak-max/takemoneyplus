import db from "./db";

export type Metrics = {
  waitlist: {
    total: number;
    last7d: number;
    byCurrency: { currency: string; count: number }[];
    byCity: { city: string; count: number }[];
    byRole: { role: string; count: number }[];
    recent: { email: string; role: string; currency: string; city: string; createdAt: string }[];
  };
  users: { total: number; last7d: number };
  ads: {
    total: number;
    active: number;
    byCurrency: { currency: string; count: number }[];
  };
  interests: { likes: number; skips: number };
};

const countSince = (table: "waitlist" | "users", days: number) =>
  (db
    .prepare(
      `SELECT COUNT(*) AS n FROM ${table} WHERE created_at > datetime('now', ?)`,
    )
    .get(`-${days} days`) as { n: number }).n;

export function loadMetrics(): Metrics {
  const wlTotal = (db.prepare("SELECT COUNT(*) AS n FROM waitlist").get() as { n: number }).n;
  const wlByCurrency = db
    .prepare(
      `SELECT currency, COUNT(*) AS count FROM waitlist GROUP BY currency ORDER BY count DESC`,
    )
    .all() as { currency: string; count: number }[];
  const wlByCity = db
    .prepare(
      `SELECT city, COUNT(*) AS count FROM waitlist GROUP BY city ORDER BY count DESC LIMIT 10`,
    )
    .all() as { city: string; count: number }[];
  const wlByRole = db
    .prepare(`SELECT role, COUNT(*) AS count FROM waitlist GROUP BY role`)
    .all() as { role: string; count: number }[];
  const wlRecent = db
    .prepare(
      `SELECT email, role, currency, city, created_at AS createdAt
       FROM waitlist ORDER BY created_at DESC LIMIT 10`,
    )
    .all() as Metrics["waitlist"]["recent"];

  const usersTotal = (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;

  const adsTotal = (db.prepare("SELECT COUNT(*) AS n FROM ads").get() as { n: number }).n;
  const adsActive = (
    db
      .prepare("SELECT COUNT(*) AS n FROM ads WHERE status = 'active' AND valid_until > datetime('now')")
      .get() as { n: number }
  ).n;
  const adsByCurrency = db
    .prepare(
      `SELECT currency, COUNT(*) AS count FROM ads GROUP BY currency ORDER BY count DESC`,
    )
    .all() as { currency: string; count: number }[];

  const likes = (
    db.prepare("SELECT COUNT(*) AS n FROM interests WHERE action = 'like'").get() as { n: number }
  ).n;
  const skips = (
    db.prepare("SELECT COUNT(*) AS n FROM interests WHERE action = 'skip'").get() as { n: number }
  ).n;

  return {
    waitlist: {
      total: wlTotal,
      last7d: countSince("waitlist", 7),
      byCurrency: wlByCurrency,
      byCity: wlByCity,
      byRole: wlByRole,
      recent: wlRecent,
    },
    users: { total: usersTotal, last7d: countSince("users", 7) },
    ads: { total: adsTotal, active: adsActive, byCurrency: adsByCurrency },
    interests: { likes, skips },
  };
}
