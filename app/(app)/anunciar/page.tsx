import AdForm from "@/app/components/AdForm";
import { getCurrentUser } from "@/lib/auth";

export default function AnunciarPage() {
  const user = getCurrentUser();
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Criar anúncio</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Conte para a vizinhança o quanto você está vendendo e por quanto. Pessoas próximas vão
          deslizar pelo seu anúncio na busca.
        </p>
      </div>
      <AdForm defaultCity={user?.city ?? null} />
    </section>
  );
}
