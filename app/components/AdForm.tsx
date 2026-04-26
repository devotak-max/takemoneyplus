"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CURRENCY_LABELS,
  MAX_AMOUNT_PER_CURRENCY,
  SUPPORTED_CURRENCIES,
  type Currency,
} from "@/lib/cap";

type Geo = { lat: number; lng: number; status: "loading" | "ok" | "denied" | "unsupported" };

export default function AdForm({ defaultCity }: { defaultCity: string | null }) {
  const router = useRouter();
  const [currency, setCurrency] = useState<Currency>("USD");
  const [amount, setAmount] = useState<string>("");
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [city, setCity] = useState<string>(defaultCity ?? "");
  const [validDays, setValidDays] = useState<number>(7);
  const [geo, setGeo] = useState<Geo>({ lat: 0, lng: 0, status: "loading" });
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

  const cap = MAX_AMOUNT_PER_CURRENCY[currency];
  const amountNumber = Number(amount.replace(",", "."));
  const unitPriceNumber = Number(unitPrice.replace(",", "."));
  const overCap = Number.isFinite(amountNumber) && amountNumber > cap;

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
    if (!Number.isFinite(unitPriceNumber) || unitPriceNumber <= 0) {
      setError("Informe o preço unitário em reais.");
      return;
    }
    if (city.trim().length < 2) {
      setError("Informe a cidade.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currency,
        amount: amountNumber,
        unitPriceBrl: unitPriceNumber,
        city: city.trim(),
        lat: geo.lat,
        lng: geo.lng,
        validDays,
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <label className="block text-sm font-medium text-ink" htmlFor="unitPrice">
            Preço unitário em R$
          </label>
          <input
            id="unitPrice"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            inputMode="decimal"
            placeholder="ex: 5,05"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          {Number.isFinite(amountNumber) && Number.isFinite(unitPriceNumber) && (
            <p className="mt-1 text-xs text-ink-muted">
              Total estimado:{" "}
              <strong>
                {(amountNumber * unitPriceNumber).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <div>
          <label className="block text-sm font-medium text-ink" htmlFor="validDays">
            Validade (dias)
          </label>
          <input
            id="validDays"
            type="number"
            min={1}
            max={30}
            value={validDays}
            onChange={(e) => setValidDays(Number(e.target.value) || 1)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
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
        disabled={submitting || geo.status !== "ok"}
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
