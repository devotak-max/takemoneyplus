"use client";

import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();
  const onClick = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-ink-soft transition hover:bg-canvas"
    >
      Sair
    </button>
  );
}
