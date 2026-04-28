import Link from "next/link";
import { redirect } from "next/navigation";
import SignupForm from "../components/SignupForm";
import SsoButtons from "../components/SsoButtons";
import { getCurrentUser } from "@/lib/auth";

export default function SignupPage() {
  if (getCurrentUser()) redirect("/descobrir");
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 px-6 py-12">
      <Link href="/" className="text-sm text-ink-muted hover:text-ink">
        ← voltar
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Criar conta</h1>
        <p className="mt-2 text-ink-soft">
          Vamos pedir alguns dados básicos pra você começar a anunciar e curtir ofertas perto.
        </p>
      </div>
      <SignupForm />
      <SsoButtons label="ou cadastre-se com" />
      <p className="text-center text-sm text-ink-muted">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-brand hover:text-brand-dark">
          Entrar
        </Link>
      </p>
    </main>
  );
}
