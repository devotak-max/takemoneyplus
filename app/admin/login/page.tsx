import Link from "next/link";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/app/components/AdminLoginForm";
import { isAdminAuthenticated } from "@/lib/admin";

export default function AdminLoginPage() {
  if (isAdminAuthenticated()) redirect("/admin");
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 px-6 py-12">
      <Link href="/" className="text-sm text-ink-muted hover:text-ink">
        ← voltar
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Painel administrativo</h1>
        <p className="mt-2 text-ink-soft">Acesso restrito ao time da Monetheus.</p>
      </div>
      <AdminLoginForm />
    </main>
  );
}
