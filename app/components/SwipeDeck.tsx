"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CURRENCY_LABELS,
  SUPPORTED_CURRENCIES,
  type Currency,
} from "@/lib/cap";

type Ad = {
  id: number;
  currency: Currency;
  amount: number;
  unitPriceBrl: number;
  spreadPct: number;
  rateDate: string | null;
  city: string;
  sellerName: string;
  sellerInitials: string;
  distanceKm: number | null;
  validUntil: string;
};

type Origin = { lat: number; lng: number };
type GeoStatus = "loading" | "ok" | "denied" | "unsupported";

const fmtBrl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4 });

const SWIPE_THRESHOLD_PX = 110;
const RADIUS_STORAGE_KEY = "monetheus.radius";
const DEFAULT_RADIUS_KM = 30;
const MIN_RADIUS_KM = 5;
const MAX_RADIUS_KM = 100;

function loadStoredRadius(): number {
  if (typeof window === "undefined") return DEFAULT_RADIUS_KM;
  const v = Number(window.localStorage.getItem(RADIUS_STORAGE_KEY));
  if (!Number.isFinite(v) || v < MIN_RADIUS_KM || v > MAX_RADIUS_KM) return DEFAULT_RADIUS_KM;
  return v;
}

export default function SwipeDeck() {
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("loading");
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [currency, setCurrency] = useState<Currency | "ALL">("ALL");
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS_KM);
  const [ads, setAds] = useState<Ad[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topIndex, setTopIndex] = useState(0);
  const [matchToast, setMatchToast] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const [exiting, setExiting] = useState<{ direction: "like" | "skip" } | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setRadiusKm(loadStoredRadius());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(RADIUS_STORAGE_KEY, String(radiusKm));
    }
  }, [radiusKm]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGeoStatus("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("ok");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }, []);

  useEffect(() => {
    if (geoStatus === "loading") return;
    const params = new URLSearchParams();
    if (currency !== "ALL") params.set("currency", currency);
    if (origin) {
      params.set("lat", origin.lat.toString());
      params.set("lng", origin.lng.toString());
    }
    params.set("radiusKm", String(radiusKm));
    params.set("limit", "30");

    setAds(null);
    setError(null);
    setTopIndex(0);
    fetch(`/api/ads?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("erro");
        return res.json();
      })
      .then((data: { ads: Ad[] }) => setAds(data.ads))
      .catch(() => setError("Não foi possível carregar ofertas."));
  }, [currency, origin, geoStatus, radiusKm]);

  const visibleAds = useMemo(() => (ads ? ads.slice(topIndex, topIndex + 3) : []), [ads, topIndex]);
  const top = visibleAds[0];

  const commit = async (action: "like" | "skip") => {
    if (!top) return;
    setExiting({ direction: action });
    fetch("/api/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adId: top.id, action }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { matchId?: number } | null) => {
        if (action === "like" && data?.matchId) {
          setMatchToast("Match! Abra suas conversas para combinar o encontro.");
          setTimeout(() => setMatchToast(null), 4000);
        }
      })
      .catch(() => {});
    setTimeout(() => {
      setTopIndex((i) => i + 1);
      setDrag({ x: 0, y: 0, active: false });
      setExiting(null);
    }, 220);
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (exiting) return;
    pointerStart.current = { x: event.clientX, y: event.clientY };
    cardRef.current?.setPointerCapture(event.pointerId);
    setDrag({ x: 0, y: 0, active: true });
  };
  const onPointerMove = (event: React.PointerEvent) => {
    if (!pointerStart.current || !drag.active) return;
    setDrag({
      x: event.clientX - pointerStart.current.x,
      y: event.clientY - pointerStart.current.y,
      active: true,
    });
  };
  const onPointerUp = (event: React.PointerEvent) => {
    if (!pointerStart.current) return;
    cardRef.current?.releasePointerCapture(event.pointerId);
    pointerStart.current = null;
    if (drag.x > SWIPE_THRESHOLD_PX) {
      commit("like");
    } else if (drag.x < -SWIPE_THRESHOLD_PX) {
      commit("skip");
    } else {
      setDrag({ x: 0, y: 0, active: false });
    }
  };

  const transform = exiting
    ? exiting.direction === "like"
      ? "translateX(140%) rotate(18deg)"
      : "translateX(-140%) rotate(-18deg)"
    : drag.active
      ? `translate(${drag.x}px, ${drag.y * 0.4}px) rotate(${drag.x / 25}deg)`
      : "translate(0, 0) rotate(0deg)";

  const likeOpacity = Math.max(0, Math.min(1, drag.x / SWIPE_THRESHOLD_PX));
  const skipOpacity = Math.max(0, Math.min(1, -drag.x / SWIPE_THRESHOLD_PX));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="currency-filter" className="text-sm text-ink-muted">
            Moeda
          </label>
          <select
            id="currency-filter"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency | "ALL")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            <option value="ALL">Todas</option>
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c} — {CURRENCY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <GeoStatusLabel status={geoStatus} />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor="radius" className="font-medium text-ink">
            Raio de busca
          </label>
          <span className="text-ink-muted">{radiusKm} km</span>
        </div>
        <input
          id="radius"
          type="range"
          min={MIN_RADIUS_KM}
          max={MAX_RADIUS_KM}
          step={1}
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          className="mt-2 w-full accent-brand"
        />
        <div className="flex justify-between text-[11px] text-ink-muted">
          <span>{MIN_RADIUS_KM} km</span>
          <span>{MAX_RADIUS_KM} km</span>
        </div>
      </div>

      <div className="relative mx-auto h-[500px] w-full max-w-sm">
        {ads === null && !error && (
          <Placeholder text="Carregando ofertas…" />
        )}
        {error && <Placeholder text={error} tone="error" />}
        {ads !== null && !top && (
          <Placeholder text="Você viu todas as ofertas por aqui. Aumente o raio ou volte mais tarde." />
        )}

        {visibleAds
          .slice()
          .reverse()
          .map((ad, idx, arr) => {
            const reversedIndex = arr.length - 1 - idx;
            const isTop = reversedIndex === 0;
            return (
              <Card
                key={ad.id}
                ad={ad}
                stackOffset={reversedIndex}
                refSetter={isTop ? (el) => (cardRef.current = el) : undefined}
                style={isTop ? { transform } : undefined}
                onPointerDown={isTop ? onPointerDown : undefined}
                onPointerMove={isTop ? onPointerMove : undefined}
                onPointerUp={isTop ? onPointerUp : undefined}
                onPointerCancel={isTop ? onPointerUp : undefined}
                likeOpacity={isTop ? likeOpacity : 0}
                skipOpacity={isTop ? skipOpacity : 0}
              />
            );
          })}

        {matchToast && (
          <div className="pointer-events-none absolute inset-x-0 -top-3 mx-auto w-fit rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg">
            {matchToast}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => commit("skip")}
          disabled={!top}
          aria-label="Pular"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-ink shadow-md ring-1 ring-black/10 transition hover:scale-105 active:scale-95 disabled:opacity-40"
        >
          ✕
        </button>
        <button
          type="button"
          onClick={() => commit("like")}
          disabled={!top}
          aria-label="Curtir"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl text-white shadow-lg shadow-brand/30 transition hover:scale-105 active:scale-95 disabled:opacity-40"
        >
          ♥
        </button>
      </div>

      <p className="text-center text-xs text-ink-muted">
        Arraste para o lado ou use os botões. ♥ = quero comprar · ✕ = pular.
      </p>
    </div>
  );
}

function GeoStatusLabel({ status }: { status: GeoStatus }) {
  const text = {
    loading: "Capturando localização…",
    ok: "Localização ativa",
    denied: "Sem localização — usando São Paulo",
    unsupported: "Geolocalização indisponível",
  }[status];
  const color = status === "ok" ? "text-emerald-600" : "text-ink-muted";
  return <span className={`text-xs ${color}`}>{text}</span>;
}

function Placeholder({ text, tone = "neutral" }: { text: string; tone?: "neutral" | "error" }) {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center rounded-3xl border-2 border-dashed p-6 text-center text-sm ${
        tone === "error" ? "border-rose-300 text-rose-600" : "border-slate-200 text-ink-muted"
      }`}
    >
      {text}
    </div>
  );
}

function Card({
  ad,
  stackOffset,
  refSetter,
  style,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  likeOpacity,
  skipOpacity,
}: {
  ad: Ad;
  stackOffset: number;
  refSetter?: (el: HTMLDivElement | null) => void;
  style?: React.CSSProperties;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerCancel?: (e: React.PointerEvent) => void;
  likeOpacity: number;
  skipOpacity: number;
}) {
  const isTop = stackOffset === 0;
  const stackTransform = !isTop
    ? `translateY(${stackOffset * 8}px) scale(${1 - stackOffset * 0.04})`
    : undefined;

  const spreadLabel =
    ad.spreadPct > 0.0001
      ? `+${(ad.spreadPct * 100).toFixed(1)}%`
      : ad.spreadPct < -0.0001
        ? `${(ad.spreadPct * 100).toFixed(1)}%`
        : "PTAX";

  return (
    <div
      ref={refSetter}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className={`absolute inset-0 select-none touch-none rounded-3xl bg-white shadow-xl ring-1 ring-black/5 ${
        isTop ? "cursor-grab active:cursor-grabbing transition-transform duration-200 ease-out" : "transition-transform"
      }`}
      style={isTop ? style : { transform: stackTransform }}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-3xl">
        <div className="flex items-center gap-3 bg-gradient-to-br from-brand to-brand-dark p-5 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-base font-semibold">
            {ad.sellerInitials || "?"}
          </div>
          <div className="flex-1">
            <div className="font-semibold">{ad.sellerName || "Anúncio"}</div>
            <div className="text-xs text-white/80">
              {ad.city}
              {ad.distanceKm !== null && ad.distanceKm < 20000
                ? ` · ${ad.distanceKm.toFixed(1)} km`
                : ""}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-4 p-6">
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-muted">Vendendo</div>
            <div className="mt-1 text-3xl font-bold tracking-tight text-ink">
              {ad.amount.toLocaleString("pt-BR")} {ad.currency}
            </div>
          </div>
          <div className="rounded-xl bg-canvas p-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wide text-ink-muted">
                Preço unitário
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                {spreadLabel}
              </span>
            </div>
            <div className="mt-0.5 font-semibold text-ink">{fmtBrl(ad.unitPriceBrl)}</div>
            <div className="mt-1 text-xs text-ink-muted">
              Total: {(ad.amount * ad.unitPriceBrl).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              {ad.rateDate && (
                <>
                  {" · ref. PTAX "}
                  {new Date(ad.rateDate).toLocaleDateString("pt-BR")}
                </>
              )}
            </div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200/60 text-xs text-emerald-800">
            Expira em {new Date(ad.validUntil).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
          </div>
        </div>

        {isTop && (
          <>
            <div
              className="pointer-events-none absolute left-6 top-6 rounded-md border-2 border-emerald-500 px-3 py-1 text-sm font-bold uppercase text-emerald-600 -rotate-12"
              style={{ opacity: likeOpacity }}
            >
              quero
            </div>
            <div
              className="pointer-events-none absolute right-6 top-6 rounded-md border-2 border-rose-500 px-3 py-1 text-sm font-bold uppercase text-rose-600 rotate-12"
              style={{ opacity: skipOpacity }}
            >
              pular
            </div>
          </>
        )}
      </div>
    </div>
  );
}
