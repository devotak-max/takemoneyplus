"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/descobrir", label: "Descobrir" },
  { href: "/anunciar", label: "Anunciar" },
  { href: "/meus-anuncios", label: "Meus anúncios" },
];

export default function NavBar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
      <Link href="/descobrir" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
          M
        </div>
        <span className="font-semibold tracking-tight text-ink">Monetheus</span>
      </Link>
      <div className="flex items-center gap-1">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                active ? "bg-brand text-white" : "text-ink-soft hover:bg-canvas"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="hidden text-ink-muted sm:inline">Olá, {userName.split(" ")[0]}</span>
        <button
          onClick={logout}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-ink-soft transition hover:bg-canvas"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
