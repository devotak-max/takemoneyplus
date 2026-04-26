import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin";
import { loadMetrics } from "@/lib/metrics";
import AdminLogoutButton from "@/app/components/AdminLogoutButton";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  buyer: "Comprar",
  seller: "Vender",
  both: "Os dois",
};

export default function AdminPage() {
  if (!isAdminAuthenticated()) redirect("/admin/login");
  const m = loadMetrics();

  return (
    <main className="min-h-screen bg-canvas">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white">
              M
            </div>
            <span className="font-semibold tracking-tight text-ink">Painel · Monetheus</span>
          </div>
          <AdminLogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <section>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Visão geral</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Waitlist" value={m.waitlist.total} hint={`+${m.waitlist.last7d} em 7d`} />
            <Stat label="Usuários" value={m.users.total} hint={`+${m.users.last7d} em 7d`} />
            <Stat label="Anúncios ativos" value={m.ads.active} hint={`${m.ads.total} no total`} />
            <Stat
              label="Curtidas / Pulos"
              value={`${m.interests.likes} / ${m.interests.skips}`}
              hint={
                m.interests.likes + m.interests.skips > 0
                  ? `${Math.round(
                      (m.interests.likes / (m.interests.likes + m.interests.skips)) * 100,
                    )}% like rate`
                  : "sem dados"
              }
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card title="Waitlist por moeda">
            <BarList rows={m.waitlist.byCurrency.map((r) => ({ label: r.currency, value: r.count }))} />
          </Card>
          <Card title="Waitlist por cidade (top 10)">
            <BarList rows={m.waitlist.byCity.map((r) => ({ label: r.city, value: r.count }))} />
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card title="Waitlist por intenção">
            <BarList
              rows={m.waitlist.byRole.map((r) => ({
                label: ROLE_LABEL[r.role] ?? r.role,
                value: r.count,
              }))}
            />
          </Card>
          <Card title="Anúncios por moeda">
            <BarList rows={m.ads.byCurrency.map((r) => ({ label: r.currency, value: r.count }))} />
          </Card>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-ink">Inscrições recentes</h2>
          <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-4 py-2.5">Quando</th>
                  <th className="px-4 py-2.5">E-mail</th>
                  <th className="px-4 py-2.5">Quer</th>
                  <th className="px-4 py-2.5">Moeda</th>
                  <th className="px-4 py-2.5">Cidade</th>
                </tr>
              </thead>
              <tbody>
                {m.waitlist.recent.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-ink-muted" colSpan={5}>
                      Ainda sem inscrições.
                    </td>
                  </tr>
                ) : (
                  m.waitlist.recent.map((r, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-4 py-2.5 text-ink-muted">
                        {new Date(r.createdAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-2.5">{r.email}</td>
                      <td className="px-4 py-2.5">{ROLE_LABEL[r.role] ?? r.role}</td>
                      <td className="px-4 py-2.5">{r.currency}</td>
                      <td className="px-4 py-2.5">{r.city}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="text-xs uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-1 text-3xl font-bold tracking-tight text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function BarList({ rows }: { rows: { label: string; value: number }[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-muted">Sem dados ainda.</p>;
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink">{r.label}</span>
            <span className="text-ink-muted">{r.value}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
