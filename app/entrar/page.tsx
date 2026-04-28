import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import LoginForm from "../components/LoginForm";
import SsoButtons from "../components/SsoButtons";
import { getCurrentUser } from "@/lib/auth";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { oauth_error?: string };
}) {
  if (getCurrentUser()) redirect("/descobrir");
  const oauthError = searchParams?.oauth_error;
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 px-6 py-12">
      <Link href="/" className="text-sm text-ink-muted hover:text-ink">
        ← voltar
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Entrar</h1>
        <p className="mt-2 text-ink-soft">Acesse para descobrir ofertas e gerenciar seus anúncios.</p>
      </div>
      {oauthError && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">
          Não foi possível concluir o login social ({oauthError}). Tente novamente.
        </div>
      )}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <SsoButtons />
      <p className="text-center text-sm text-ink-muted">
        Ainda não tem conta?{" "}
        <Link href="/cadastrar" className="font-semibold text-brand hover:text-brand-dark">
          Criar conta
        </Link>
      </p>
    </main>
  );
}
