import SwipeDemo from "./components/SwipeDemo";
import WaitlistForm from "./components/WaitlistForm";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-24 px-6 py-10">
      <Header />
      <Hero />
      <Pillars />
      <HowItWorks />
      <LegalNote />
      <Waitlist />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
          M
        </div>
        <span className="text-lg font-semibold tracking-tight text-ink">Monetheus</span>
      </div>
      <a
        href="#waitlist"
        className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-soft"
      >
        Entrar na lista
      </a>
    </header>
  );
}

function Hero() {
  return (
    <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-light/30 px-3 py-1 text-xs font-medium text-brand-dark">
          Câmbio turismo entre pessoas
        </span>
        <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
          Compre e venda moeda <br />
          <span className="text-brand">sem o spread</span> da casa de câmbio.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-soft">
          Conectamos quem está voltando de viagem com quem está prestes a embarcar. Você descobre
          ofertas perto de você no estilo dos apps de relacionamento — desliza, curte, combina e
          economiza.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a
            href="#waitlist"
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand/20 transition hover:bg-brand-dark"
          >
            Quero economizar →
          </a>
          <span className="text-sm text-ink-muted">Pré-cadastro gratuito · Sem cartão</span>
        </div>
      </div>

      <div className="flex justify-center">
        <SwipeDemo />
      </div>
    </section>
  );
}

function Pillars() {
  const pillars = [
    {
      title: "Buy money",
      desc: "Vai viajar? Encontre quem está voltando com sobra de moeda perto de você e pague menos que na casa de câmbio.",
    },
    {
      title: "Sell money",
      desc: "Voltou com moeda na carteira? Anuncie e receba mais do que o preço de recompra do mercado.",
    },
    {
      title: "Save money",
      desc: "Sem spread, sem IOF da operação cambial: o ganho do intermediário fica com você e a contraparte.",
    },
  ];

  return (
    <section className="grid gap-6 md:grid-cols-3">
      {pillars.map((p) => (
        <div
          key={p.title}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            ●
          </div>
          <h3 className="mt-4 text-lg font-semibold text-ink">{p.title}</h3>
          <p className="mt-1 text-sm text-ink-soft">{p.desc}</p>
        </div>
      ))}
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "1",
      title: "Diga o que você quer",
      desc: "Escolha a moeda e o quanto pretende comprar ou vender. A gente identifica sua localização para mostrar gente perto.",
    },
    {
      n: "2",
      title: "Desliza pelas ofertas",
      desc: "Cada perfil mostra preço unitário, comparativo com a PTAX, distância e reputação. Curte ou pula em segundos.",
    },
    {
      n: "3",
      title: "Combina o encontro",
      desc: "Quando há match, vocês conversam pelo chat e combinam um ponto seguro para fazer a troca.",
    },
    {
      n: "4",
      title: "Avalia a contraparte",
      desc: "Após a troca, ambos avaliam um ao outro — boa reputação rende mais matches no próximo anúncio.",
    },
  ];

  return (
    <section>
      <h2 className="text-3xl font-bold tracking-tight text-ink">Como funciona</h2>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Inspirado nos apps de relacionamento: descoberta visual, decisões rápidas, foco no que está
        perto de você.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              {s.n}
            </div>
            <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
            <p className="mt-1 text-sm text-ink-soft">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function LegalNote() {
  return (
    <section className="rounded-2xl bg-ink p-8 text-white shadow-lg sm:p-10">
      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-light/20 px-3 py-1 text-xs font-medium text-brand-light">
            Conformidade legal
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Limite de USD 500 por operação
          </h2>
          <p className="mt-3 text-sm text-white/80">
            Operações de câmbio entre pessoas físicas no Brasil são permitidas até o limite de
            US$ 500 (ou equivalente) por transação, conforme o Marco Cambial (Lei 14.286/2021)
            regulamentado pelo Banco Central. A Monetheus apenas conecta as partes — a entrega da
            moeda acontece presencialmente entre vocês.
          </p>
        </div>
        <ul className="space-y-3 text-sm text-white/85">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-brand-light">✓</span>
            Anúncios travados em USD 500 (ou equivalente em outras moedas).
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-brand-light">✓</span>
            Verificação de identidade (KYC) leve antes do primeiro anúncio.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-brand-light">✓</span>
            Reputação mútua e denúncia para combater fraude.
          </li>
        </ul>
      </div>
    </section>
  );
}

function Waitlist() {
  return (
    <section id="waitlist" className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-ink">
          Entre na lista de pré-lançamento
        </h2>
        <p className="mt-3 max-w-md text-ink-soft">
          Vamos abrir cidade por cidade. Conta pra gente onde você está e qual moeda te interessa —
          priorizamos os locais com mais pessoas na fila.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-ink-soft">
          <li>· Acesso antecipado às primeiras turmas</li>
          <li>· Sem custo no MVP</li>
          <li>· Indicação dá prioridade na fila</li>
        </ul>
      </div>
      <WaitlistForm />
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 pt-6 text-sm text-ink-muted">
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <span>© {new Date().getFullYear()} Monetheus · Câmbio turismo entre pessoas</span>
        <span>Operações limitadas a USD 500 por transação · Lei 14.286/2021</span>
      </div>
    </footer>
  );
}
