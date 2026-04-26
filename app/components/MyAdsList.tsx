"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type InterestedUser = { id: number; name: string; phone: string; createdAt: string };
type Ad = {
  id: number;
  currency: string;
  amount: number;
  unitPriceBrl: number;
  city: string;
  status: string;
  validUntil: string;
  createdAt: string;
  interestCount: number;
  interestedUsers: InterestedUser[];
};

const fmtBrl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export default function MyAdsList() {
  const [ads, setAds] = useState<Ad[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const res = await fetch("/api/ads/mine");
    if (!res.ok) {
      setError("Não foi possível carregar seus anúncios.");
      return;
    }
    const data = (await res.json()) as { ads: Ad[] };
    setAds(data.ads);
  };

  useEffect(() => {
    refresh();
  }, []);

  const remove = async (id: number) => {
    if (!confirm("Remover este anúncio?")) return;
    const res = await fetch(`/api/ads/${id}`, { method: "DELETE" });
    if (res.ok) refresh();
  };

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (ads === null) return <p className="text-sm text-ink-muted">Carregando…</p>;
  if (ads.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
        <p className="text-ink-soft">Você ainda não tem anúncios.</p>
        <Link
          href="/anunciar"
          className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white"
        >
          Criar primeiro anúncio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ads.map((ad) => (
        <article key={ad.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-ink-muted">
                {ad.city} · expira em {new Date(ad.validUntil).toLocaleDateString("pt-BR")}
              </div>
              <h3 className="mt-1 text-xl font-semibold text-ink">
                {ad.amount.toLocaleString("pt-BR")} {ad.currency} ·{" "}
                <span className="text-brand">{fmtBrl(ad.unitPriceBrl)}/un</span>
              </h3>
              <p className="text-sm text-ink-muted">
                Total: {fmtBrl(ad.amount * ad.unitPriceBrl)}
              </p>
            </div>
            <button
              onClick={() => remove(ad.id)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-ink-soft transition hover:border-rose-200 hover:text-rose-600"
            >
              Remover
            </button>
          </header>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <h4 className="text-sm font-semibold text-ink">
              Interessados ({ad.interestCount})
            </h4>
            {ad.interestedUsers.length === 0 ? (
              <p className="mt-1 text-sm text-ink-muted">
                Ainda ninguém deu match. Compartilhe seu anúncio para acelerar.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm">
                {ad.interestedUsers.map((u) => (
                  <li key={u.id} className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2">
                    <span className="font-medium text-ink">{u.name}</span>
                    <a href={`tel:${u.phone}`} className="text-brand hover:text-brand-dark">
                      {u.phone}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
