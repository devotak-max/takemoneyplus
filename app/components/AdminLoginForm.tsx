"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: String(form.get("password") ?? "") }),
    });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setError(data.error ?? "Falha ao autenticar.");
    setSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-md ring-1 ring-black/5">
      <label className="block">
        <span className="block text-sm font-medium text-ink">Senha do painel</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-slate-200 bg-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Entrando…" : "Entrar"}
      </button>
      {error && (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-ink-muted">
        Senha definida em <code>ADMIN_PASSWORD</code>. Padrão dev: <code>monetheus-dev</code>.
      </p>
    </form>
  );
}
