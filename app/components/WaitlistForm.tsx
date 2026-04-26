"use client";

import { useState } from "react";

const CURRENCIES = [
  { code: "USD", label: "Dólar americano" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "Libra esterlina" },
  { code: "CAD", label: "Dólar canadense" },
  { code: "AUD", label: "Dólar australiano" },
  { code: "JPY", label: "Iene japonês" },
  { code: "CHF", label: "Franco suíço" },
  { code: "ARS", label: "Peso argentino" },
];

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; alreadyRegistered: boolean }
  | { kind: "error"; message: string };

export default function WaitlistForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ kind: "submitting" });

    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get("email") ?? "").trim(),
      role: String(form.get("role") ?? ""),
      currency: String(form.get("currency") ?? ""),
      city: String(form.get("city") ?? "").trim(),
    };

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setStatus({
          kind: "error",
          message: data.error ?? "Não foi possível registrar agora. Tente novamente em instantes.",
        });
        return;
      }

      const data = (await res.json()) as { alreadyRegistered?: boolean };
      setStatus({ kind: "success", alreadyRegistered: Boolean(data.alreadyRegistered) });
    } catch {
      setStatus({
        kind: "error",
        message: "Falha de conexão. Verifique sua internet e tente novamente.",
      });
    }
  };

  if (status.kind === "success") {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-black/5">
        <h3 className="text-lg font-semibold text-ink">
          {status.alreadyRegistered ? "Você já está na lista!" : "Pronto, você entrou na lista 🎉"}
        </h3>
        <p className="mt-2 text-sm text-ink-muted">
          A gente avisa por e-mail assim que abrir as primeiras cidades. Enquanto isso, conta pra
          quem viaja: quanto mais gente, mais ofertas perto de você.
        </p>
      </div>
    );
  }

  const submitting = status.kind === "submitting";

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-md ring-1 ring-black/5"
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="voce@exemplo.com"
          className="mt-1 w-full rounded-lg border border-slate-200 bg-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-ink">Você quer…</span>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            { value: "buyer", label: "Comprar" },
            { value: "seller", label: "Vender" },
            { value: "both", label: "Os dois" },
          ].map((opt, i) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-canvas px-3 py-2 text-sm font-medium text-ink-soft transition has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-white"
            >
              <input
                type="radio"
                name="role"
                value={opt.value}
                defaultChecked={i === 0}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-ink">
            Moeda de interesse
          </label>
          <select
            id="currency"
            name="currency"
            required
            defaultValue="USD"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-ink">
            Cidade
          </label>
          <input
            id="city"
            name="city"
            type="text"
            required
            minLength={2}
            maxLength={80}
            placeholder="São Paulo"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/20 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Entrando na lista…" : "Quero economizar no câmbio"}
      </button>

      {status.kind === "error" && (
        <p className="text-sm text-rose-600" role="alert">
          {status.message}
        </p>
      )}

      <p className="text-xs text-ink-muted">
        Enviando, você concorda em receber atualizações sobre o lançamento. Sem spam.
      </p>
    </form>
  );
}
