"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string; details?: Record<string, string[] | undefined> };

export default function SignupForm() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState({ kind: "submitting" });

    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      fullName: String(form.get("fullName") ?? "").trim(),
      cpf: String(form.get("cpf") ?? ""),
      phone: String(form.get("phone") ?? ""),
      city: String(form.get("city") ?? "").trim(),
    };

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/anunciar");
      router.refresh();
      return;
    }

    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      details?: Record<string, string[] | undefined>;
    };
    setState({
      kind: "error",
      message: data.error ?? "Não foi possível concluir o cadastro.",
      details: data.details,
    });
  };

  const fieldError = (field: string) =>
    state.kind === "error" ? state.details?.[field]?.[0] : undefined;

  const submitting = state.kind === "submitting";

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-md ring-1 ring-black/5">
      <Field label="Nome completo" name="fullName" autoComplete="name" required error={fieldError("fullName")} />
      <Field label="E-mail" name="email" type="email" autoComplete="email" required error={fieldError("email")} />
      <Field
        label="Senha (mín. 8 caracteres)"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        error={fieldError("password")}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="CPF" name="cpf" inputMode="numeric" placeholder="000.000.000-00" required error={fieldError("cpf")} />
        <Field
          label="Telefone"
          name="phone"
          inputMode="tel"
          placeholder="(11) 99999-9999"
          required
          error={fieldError("phone")}
        />
      </div>
      <Field label="Cidade" name="city" autoComplete="address-level2" required error={fieldError("city")} />

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/20 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Criando conta…" : "Criar conta"}
      </button>

      {state.kind === "error" && !state.details && (
        <p className="text-sm text-rose-600" role="alert">
          {state.message}
        </p>
      )}

      <p className="text-xs text-ink-muted">
        Ao criar a conta você concorda em respeitar o limite de USD 500 por operação previsto na
        Lei 14.286/2021.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  type = "text",
  ...rest
}: {
  label: string;
  name: string;
  error?: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        type={type}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        {...rest}
      />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}
