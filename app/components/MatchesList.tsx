"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type MatchSummary = {
  id: number;
  adId: number;
  status: "open" | "closed";
  createdAt: string;
  role: "buyer" | "seller";
  partnerName: string;
  partnerInitials: string;
  currency: string;
  amount: number;
  unitPriceBrl: number;
  city: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
};

const fmtBrl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function relative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default function MatchesList() {
  const [matches, setMatches] = useState<MatchSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/matches")
      .then(async (res) => {
        if (!res.ok) throw new Error("erro");
        return res.json();
      })
      .then((data: { matches: MatchSummary[] }) => setMatches(data.matches))
      .catch(() => setError("Não foi possível carregar conversas."));
  }, []);

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (matches === null) return <p className="text-sm text-ink-muted">Carregando…</p>;
  if (matches.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
        <p className="text-ink-soft">Você ainda não tem conversas.</p>
        <p className="mt-2 text-sm text-ink-muted">
          Curta uma oferta na tela de descoberta para abrir uma conversa.
        </p>
        <Link
          href="/descobrir"
          className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white"
        >
          Ver ofertas
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {matches.map((m) => (
        <li key={m.id}>
          <Link
            href={`/conversas/${m.id}`}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:bg-canvas"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
              {m.partnerInitials || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-semibold text-ink">{m.partnerName}</span>
                <span className="text-[11px] text-ink-muted">
                  {relative(m.lastMessageAt ?? m.createdAt)}
                </span>
              </div>
              <div className="text-xs text-ink-muted">
                {m.role === "buyer" ? "Você quer comprar" : "Querem comprar de você"} ·{" "}
                {m.amount.toLocaleString("pt-BR")} {m.currency} · {fmtBrl(m.amount * m.unitPriceBrl)}
              </div>
              <div className="mt-1 truncate text-sm text-ink-soft">
                {m.lastMessage ?? "Diga olá para começar a combinar o encontro."}
              </div>
            </div>
            {m.status === "closed" && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase text-ink-muted">
                encerrado
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
