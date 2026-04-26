import SwipeDeck from "@/app/components/SwipeDeck";

export default function DescobrirPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Descobrir ofertas</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Arraste para a direita as ofertas que te interessam. Quando você curte, o vendedor
          recebe seu telefone para combinar a troca presencial.
        </p>
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <SwipeDeck />
      </div>
    </section>
  );
}
