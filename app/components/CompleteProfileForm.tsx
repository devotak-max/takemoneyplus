"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompleteProfileForm({ defaultCity }: { defaultCity: string }) {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpf, phone, city: city.trim() }),
    });
    if (res.ok) {
      router.push("/descobrir");
      router.refresh();
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setError(data.error ?? "Não foi possível completar seu cadastro.");
    setSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-md ring-1 ring-black/5">
      <div>
        <label className="block text-sm font-medium text-ink" htmlFor="cpf">
          CPF
        </label>
        <input
          id="cpf"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          inputMode="numeric"
          placeholder="000.000.000-00"
          className="mt-1 w-full rounded-lg border border-slate-200 bg-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink" htmlFor="phone">
          Telefone
        </label>
        <input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="(11) 99999-9999"
          className="mt-1 w-full rounded-lg border border-slate-200 bg-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
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

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/20 transition hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? "Salvando…" : "Concluir cadastro"}
      </button>

      {error && (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
