"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type MatchDetail = {
  id: number;
  adId: number;
  buyerId: number;
  sellerId: number;
  status: "open" | "closed";
  createdAt: string;
  ad: {
    currency: string;
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

type Message = {
  id: number;
  matchId: number;
  senderId: number;
  body: string;
  createdAt: string;
};

type Me = { id: number };

const fmtBrl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const POLL_INTERVAL_MS = 3000;

export default function ChatRoom({ matchId }: { matchId: number }) {
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const lastIdRef = useRef<number>(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user?: { id: number } } | null) => {
        if (data?.user) setMe({ id: data.user.id });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;

    const loadMatch = async () => {
      const res = await fetch(`/api/matches/${matchId}`);
      if (!res.ok) {
        if (alive) setError("Match não encontrado.");
        return;
      }
      const data = (await res.json()) as { match: MatchDetail };
      if (alive) setMatch(data.match);
    };
    loadMatch();

    const loadMessages = async () => {
      const url = lastIdRef.current
        ? `/api/matches/${matchId}/messages?after=${lastIdRef.current}`
        : `/api/matches/${matchId}/messages`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = (await res.json()) as { messages: Message[] };
      if (!alive || data.messages.length === 0) return;
      setMessages((prev) => {
        const merged = lastIdRef.current ? [...prev, ...data.messages] : data.messages;
        lastIdRef.current = merged[merged.length - 1].id;
        return merged;
      });
    };

    loadMessages();
    const handle = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => {
      alive = false;
      clearInterval(handle);
    };
  }, [matchId]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    const res = await fetch(`/api/matches/${matchId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (res.ok) {
      const data = (await res.json()) as { message: Message };
      setMessages((prev) => {
        const next = [...prev, data.message];
        lastIdRef.current = data.message.id;
        return next;
      });
      setDraft("");
    }
    setSending(false);
  };

  const total = match ? fmtBrl(match.ad.amount * match.ad.unitPriceBrl) : "";
  const closed = match?.status === "closed";

  const grouped = useMemo(() => {
    if (!me) return [] as Array<Message & { mine: boolean }>;
    return messages.map((m) => ({ ...m, mine: m.senderId === me.id }));
  }, [messages, me]);

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
        <p className="text-rose-600">{error}</p>
        <Link href="/conversas" className="mt-4 inline-block text-sm text-brand">
          ← Voltar para conversas
        </Link>
      </div>
    );
  }

  if (!match) return <p className="text-sm text-ink-muted">Carregando…</p>;

  return (
    <div className="flex h-[calc(100vh-160px)] flex-col rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
        <Link href="/conversas" className="text-sm text-ink-muted hover:text-ink">
          ←
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
          {match.partner.initials || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-ink">{match.partner.name}</div>
          <div className="text-xs text-ink-muted">
            {match.role === "buyer" ? "Vendedor" : "Comprador"} ·{" "}
            {match.ad.amount.toLocaleString("pt-BR")} {match.ad.currency} · {total} ·{" "}
            {match.ad.city}
          </div>
        </div>
        {match.partner.phone && (
          <a
            href={`tel:${match.partner.phone}`}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-ink-soft hover:border-brand hover:text-brand"
          >
            {match.partner.phone}
          </a>
        )}
      </header>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-5 py-4">
        {grouped.length === 0 && (
          <p className="mt-8 text-center text-sm text-ink-muted">
            Diga olá para combinar local, horário e forma de pagamento (PIX recomendado).
          </p>
        )}
        <div className="space-y-2">
          {grouped.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  m.mine
                    ? "bg-brand text-white"
                    : "bg-canvas text-ink ring-1 ring-slate-200/60"
                }`}
              >
                <div>{m.body}</div>
                <div
                  className={`mt-0.5 text-[10px] ${
                    m.mine ? "text-white/70" : "text-ink-muted"
                  }`}
                >
                  {new Date(m.createdAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {closed ? (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-center text-xs text-ink-muted">
          Conversa encerrada.
        </div>
      ) : (
        <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Mensagem"
            className="flex-1 rounded-full border border-slate-200 bg-canvas px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <button
            type="submit"
            disabled={sending || draft.trim().length === 0}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand/20 transition hover:bg-brand-dark disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      )}
    </div>
  );
}
