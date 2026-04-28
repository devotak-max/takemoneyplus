import MatchesList from "@/app/components/MatchesList";

export default function ConversasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Conversas</h1>
        <p className="text-sm text-ink-muted">
          Aqui aparecem todos os matches em que você curtiu uma oferta. Combine com o
          vendedor onde e quando se encontrar para a troca.
        </p>
      </div>
      <MatchesList />
    </div>
  );
}
