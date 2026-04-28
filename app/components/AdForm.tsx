"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CURRENCY_LABELS,
  MAX_AMOUNT_PER_CURRENCY,
  MAX_SPREAD_PCT,
  SUPPORTED_CURRENCIES,
  type Currency,
} from "@/lib/cap";

type Geo = { lat: number; lng: number; status: "loading" | "ok" | "denied" | "unsupported" };
type RateInfo = { currency: Currency; rateDate: string; rateBuy: number; rateSell: number } | null;
type RatesByCurrency = Partial<Record<Currency, RateInfo>>;

const fmtBrl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4 });

export default function AdForm({ defaultCity }: { defaultCity: string | null }) {
  const router = useRouter();
  const [currency, setCurrency] = useState<Currency>("USD");
  const [amount, setAmount] = useState<string>("");
  const [spreadPct, setSpreadPct] = useState<number>(0);
  const [city, setCity] = useState<string>(defaultCity ?? "");
  const [geo, setGeo] = useState<Geo>({ lat: 0, lng: 0, status: "loading" });
  const [rates, setRates] = useState<RatesByCurrency>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGeo({ lat: 0, lng: 0, status: "unsupported" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude, status: "ok" }),
      () => setGeo({ lat: 0, lng: 0, status: "denied" }),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }, []);

  useEffect(() => {
    fetch("/api/rates")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.rates) setRates(data.rates);
      })
      .catch(() => {});
  }, []);

  const cap = MAX_AMOUNT_PER_CURRENCY[currency];
  const amountNumber = Number(amount.replace(",", "."));
  const overCap = Number.isFinite(amountNumber) && amountNumber > cap;

  const rate = rates[currency] ?? null;
  const unitPrice = useMemo(() => {
    if (!rate) return null;
    return rate.rateSell * (1 + spreadPct);
  }, [rate, spreadPct]);

  const total = useMemo(() => {
    if (!unitPrice || !Number.isFinite(amountNumber)) return null;
    return unitPrice * amountNumber;
  }, [unitPrice, amountNumber]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (geo.status !== "ok") {
      setError("Precisamos da sua localização para mostrar seu anúncio para pessoas próximas.");
      return;
    }
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setError("Informe a quantidade da moeda.");
      return;
    }
    if (overCap) {
      setError(`Limite legal: até ${cap.toLocaleString("pt-BR")} ${currency} por anúncio.`);
      return;
    }
    if (city.trim().length < 2) {
      setError("Informe a cidade.");
      return;
    }
    if (!rate) {
      setError("Cotação PTAX indisponível no momento. Tente novamente em alguns segundos.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currency,
        amount: amountNumber,
        spreadPct,
        city: city.trim(),
        lat: geo.lat,
        lng: geo.lng,
      }),
    });

    if (res.ok) {
      router.push("/meus-anuncios");
      router.refresh();
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setError(data.error ?? "Não foi possível publicar o anúncio.");
    setSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-md ring-1 ring-black/5">
      <div>
        <label className="block text-sm font-medium text-ink" htmlFor="currency">
          Moeda
        </label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c} — {CURRENCY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl bg-canvas p-3 ring-1 ring-slate-200/60">
        <div className="text-[11px] uppercase tracking-wide text-ink-muted">
          PTAX referência (BCB)
        </div>
        {rate ? (
          <div className="mt-1 text-sm text-ink">
            <strong>{fmtBrl(rate.rateSell)}</strong> / {currency} ·{" "}
            <span className="text-ink-muted">
              {new Date(rate.rateDate).toLocaleDateString("pt-BR")}
            </span>
          </div>
        ) : (
          <div className="mt-1 text-sm text-ink-muted">Carregando cotação…</div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink" htmlFor="amount">
          Quantidade ({currency})
        </label>
        <input
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder={`máx ${cap.toLocaleString("pt-BR")}`}
          className={`mt-1 w-full rounded-lg border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            overCap
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
              : "border-slate-200 focus:border-brand focus:ring-brand/30"
          }`}
        />
        <p className="mt-1 text-xs text-ink-muted">
          Limite legal: {cap.toLocaleString("pt-BR")} {currency} (≈ USD 500).
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink" htmlFor="spread">
          Variação sobre PTAX{" "}
          <span className="font-normal text-ink-muted">
            ({(spreadPct * 100).toFixed(1)}%)
          </span>
        </label>
        <input
          id="spread"
          type="range"
          min={-MAX_SPREAD_PCT * 100}
          max={MAX_SPREAD_PCT * 100}
          step={0.1}
          value={spreadPct * 100}
          onChange={(e) => setSpreadPct(Number(e.target.value) / 100)}
          className="mt-2 w-full accent-brand"
        />
        <div className="flex justify-between text-[11px] text-ink-muted">
          <span>−{(MAX_SPREAD_PCT * 100).toFixed(0)}%</span>
          <span>PTAX</span>
          <span>+{(MAX_SPREAD_PCT * 100).toFixed(0)}%</span>
        </div>
        {unitPrice && (
          <p className="mt-2 text-xs text-ink-muted">
            Preço de venda: <strong>{fmtBrl(unitPrice)}</strong> / {currency}
            {total !== null && (
              <>
                {" · Total: "}
                <strong>
                  {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </strong>
              </>
            )}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink" htmlFor="city">
          Cidade
        </label>
        <input
          id="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="São Paulo"
          className="mt-1 w-full rounded-lg border border-slate-200 bg-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 ring-1 ring-emerald-200/60">
        Anúncios valem por <strong>24h</strong> e renovam automaticamente com a PTAX do dia
        enquanto você estiver ativo no app.
      </div>

      <div className="rounded-lg bg-canvas p-3 text-xs text-ink-soft">
        {geo.status === "loading" && "Capturando sua localização…"}
        {geo.status === "ok" &&
          `Localização captada (${geo.lat.toFixed(3)}, ${geo.lng.toFixed(3)}).`}
        {geo.status === "denied" &&
          "Permissão de localização negada. Ative a localização do navegador para anunciar."}
        {geo.status === "unsupported" &&
          "Seu navegador não tem suporte a geolocalização."}
      </div>

      <button
        type="submit"
        disabled={submitting || geo.status !== "ok" || !rate}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/20 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Publicando…" : "Publicar anúncio"}
      </button>

      {error && (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
