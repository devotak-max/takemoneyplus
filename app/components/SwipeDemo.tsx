"use client";

import { useState } from "react";

type Offer = {
  id: number;
  name: string;
  initials: string;
  rating: number;
  city: string;
  distanceKm: number;
  currency: string;
  amount: number;
  unitPriceBrl: number;
  ptaxBrl: number;
};

const OFFERS: Offer[] = [
  {
    id: 1,
    name: "Marina S.",
    initials: "MS",
    rating: 4.9,
    city: "São Paulo · Pinheiros",
    distanceKm: 1.2,
    currency: "USD",
    amount: 320,
    unitPriceBrl: 5.05,
    ptaxBrl: 5.18,
  },
  {
    id: 2,
    name: "Diego R.",
    initials: "DR",
    rating: 4.7,
    city: "São Paulo · Vila Mariana",
    distanceKm: 3.6,
    currency: "EUR",
    amount: 180,
    unitPriceBrl: 5.42,
    ptaxBrl: 5.61,
  },
  {
    id: 3,
    name: "Helena P.",
    initials: "HP",
    rating: 5.0,
    city: "São Paulo · Itaim",
    distanceKm: 4.1,
    currency: "USD",
    amount: 500,
    unitPriceBrl: 5.02,
    ptaxBrl: 5.18,
  },
  {
    id: 4,
    name: "Caio T.",
    initials: "CT",
    rating: 4.8,
    city: "São Paulo · Moema",
    distanceKm: 5.4,
    currency: "GBP",
    amount: 240,
    unitPriceBrl: 6.48,
    ptaxBrl: 6.71,
  },
];

const fmtBrl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export default function SwipeDemo() {
  const [index, setIndex] = useState(0);
  const [lastAction, setLastAction] = useState<"like" | "skip" | null>(null);

  const advance = (action: "like" | "skip") => {
    setLastAction(action);
    setIndex((i) => (i + 1) % OFFERS.length);
  };

  const offer = OFFERS[index];
  const savings = (offer.ptaxBrl - offer.unitPriceBrl) * offer.amount;
  const savingsPct = ((offer.ptaxBrl - offer.unitPriceBrl) / offer.ptaxBrl) * 100;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-[420px] w-full max-w-sm">
        <div
          aria-hidden
          className="absolute inset-2 rounded-3xl bg-white/70 shadow-md ring-1 ring-black/5"
        />
        <div
          aria-hidden
          className="absolute inset-1 rounded-3xl bg-white/85 shadow-md ring-1 ring-black/5"
        />
        <article
          key={offer.id}
          className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5"
        >
          <div className="flex items-center gap-3 bg-gradient-to-br from-brand to-brand-dark p-5 text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-base font-semibold">
              {offer.initials}
            </div>
            <div className="flex-1">
              <div className="font-semibold">{offer.name}</div>
              <div className="text-xs text-white/80">
                ★ {offer.rating.toFixed(1)} · {offer.city}
              </div>
            </div>
            <div className="rounded-full bg-white/15 px-2.5 py-1 text-xs">
              {offer.distanceKm.toFixed(1)} km
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center gap-4 p-6">
            <div>
              <div className="text-xs uppercase tracking-wide text-ink-muted">Vendendo</div>
              <div className="mt-1 text-3xl font-bold tracking-tight text-ink">
                {offer.amount.toLocaleString("pt-BR")} {offer.currency}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-canvas p-3">
                <div className="text-[11px] uppercase tracking-wide text-ink-muted">Preço unit.</div>
                <div className="mt-0.5 font-semibold text-ink">{fmtBrl(offer.unitPriceBrl)}</div>
              </div>
              <div className="rounded-xl bg-canvas p-3">
                <div className="text-[11px] uppercase tracking-wide text-ink-muted">PTAX hoje</div>
                <div className="mt-0.5 font-semibold text-ink-muted line-through">
                  {fmtBrl(offer.ptaxBrl)}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200/60">
              <div className="text-[11px] uppercase tracking-wide text-emerald-800">
                Você economiza
              </div>
              <div className="mt-0.5 text-lg font-bold text-emerald-700">
                {fmtBrl(savings)} <span className="text-sm font-medium">({savingsPct.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => advance("skip")}
          aria-label="Pular oferta"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-ink shadow-md ring-1 ring-black/10 transition hover:scale-105 active:scale-95"
        >
          ✕
        </button>
        <button
          type="button"
          onClick={() => advance("like")}
          aria-label="Curtir oferta"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl text-white shadow-lg shadow-brand/30 transition hover:scale-105 active:scale-95"
        >
          ♥
        </button>
      </div>

      <p className="h-5 text-xs text-ink-muted">
        {lastAction === "like" && "Curtido — partiu próximo anúncio."}
        {lastAction === "skip" && "Pulou — buscando outras ofertas."}
        {lastAction === null && "Toque ✕ para pular ou ♥ para curtir."}
      </p>
    </div>
  );
}
