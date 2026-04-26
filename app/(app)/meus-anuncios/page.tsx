import MyAdsList from "@/app/components/MyAdsList";

export default function MyAdsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Meus anúncios</h1>
        <p className="mt-2 text-ink-soft">
          Acompanhe quem demonstrou interesse e entre em contato pelo telefone para combinar a
          troca presencial em local seguro.
        </p>
      </div>
      <MyAdsList />
    </section>
  );
}
