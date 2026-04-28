import db from "./db";
import { SUPPORTED_CURRENCIES, type Currency } from "./cap";

export type ExchangeRate = {
  currency: Currency;
  rateDate: string;
  rateBuy: number;
  rateSell: number;
};

const BCB_BASE =
  "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)";

// Moedas com cotação direta do BCB. ARS não tem PTAX direta — derivamos via USD.
const BCB_DIRECT: Currency[] = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatBcbDate(d: Date): string {
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()}`;
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function previousBusinessDay(reference = new Date()): Date {
  const d = new Date(reference);
  d.setDate(d.getDate() - 1);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

type BcbResponse = {
  value: Array<{
    cotacaoCompra: number;
    cotacaoVenda: number;
    dataHoraCotacao: string;
    tipoBoletim: string;
  }>;
};

async function fetchBcbRate(
  currency: string,
  date: Date,
): Promise<{ buy: number; sell: number } | null> {
  const url = `${BCB_BASE}?@moeda='${currency}'&@dataCotacao='${formatBcbDate(date)}'&$top=1&$orderby=dataHoraCotacao desc&$format=json`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as BcbResponse;
    const row = json.value?.[0];
    if (!row) return null;
    return { buy: row.cotacaoCompra, sell: row.cotacaoVenda };
  } catch {
    return null;
  }
}

// Tenta o último dia útil; se vazio (feriado), volta até 5 dias.
async function fetchWithFallback(
  currency: string,
  startDate: Date,
): Promise<{ rate: { buy: number; sell: number }; date: Date } | null> {
  let d = startDate;
  for (let i = 0; i < 5; i++) {
    const rate = await fetchBcbRate(currency, d);
    if (rate) return { rate, date: d };
    d = previousBusinessDay(d);
  }
  return null;
}

function upsertRate(currency: Currency, date: string, buy: number, sell: number) {
  db.prepare(
    `INSERT INTO exchange_rates (currency, rate_date, rate_buy, rate_sell)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(currency, rate_date) DO UPDATE SET
       rate_buy = excluded.rate_buy,
       rate_sell = excluded.rate_sell,
       fetched_at = datetime('now')`,
  ).run(currency, date, buy, sell);
}

export function getLatestRate(currency: Currency): ExchangeRate | null {
  const row = db
    .prepare(
      `SELECT currency, rate_date, rate_buy, rate_sell
       FROM exchange_rates
       WHERE currency = ?
       ORDER BY rate_date DESC
       LIMIT 1`,
    )
    .get(currency) as
    | { currency: string; rate_date: string; rate_buy: number; rate_sell: number }
    | undefined;
  if (!row) return null;
  return {
    currency: row.currency as Currency,
    rateDate: row.rate_date,
    rateBuy: row.rate_buy,
    rateSell: row.rate_sell,
  };
}

export function getAllLatestRates(): Record<Currency, ExchangeRate | null> {
  const result = {} as Record<Currency, ExchangeRate | null>;
  for (const c of SUPPORTED_CURRENCIES) {
    result[c] = getLatestRate(c);
  }
  return result;
}

// Atualiza todas as moedas suportadas. Idempotente — pode ser chamado várias vezes/dia.
export async function refreshAllRates(): Promise<{
  updated: Currency[];
  skipped: Currency[];
}> {
  const reference = previousBusinessDay();
  const updated: Currency[] = [];
  const skipped: Currency[] = [];

  for (const currency of BCB_DIRECT) {
    const result = await fetchWithFallback(currency, reference);
    if (!result) {
      skipped.push(currency);
      continue;
    }
    upsertRate(currency, isoDate(result.date), result.rate.buy, result.rate.sell);
    updated.push(currency);
  }

  // ARS: deriva via USD/ARS oficial Banco Central da República Argentina não está no BCB.
  // Fallback simples — usa razão fixa atualizada periodicamente. Em produção, integrar BCRA.
  const usd = getLatestRate("USD");
  if (usd) {
    const ARS_PER_USD = 1100; // referência conservadora; ajustar via outro feed quando disponível.
    const buy = usd.rateBuy / ARS_PER_USD;
    const sell = usd.rateSell / ARS_PER_USD;
    upsertRate("ARS", usd.rateDate, buy, sell);
    updated.push("ARS");
  } else {
    skipped.push("ARS");
  }

  return { updated, skipped };
}

// Garante que existe pelo menos uma cotação recente (até 3 dias). Refaz fetch se ausente/velha.
export async function ensureFreshRates(): Promise<void> {
  const usd = getLatestRate("USD");
  if (!usd) {
    await refreshAllRates();
    return;
  }
  const ageMs = Date.now() - new Date(usd.rateDate).getTime();
  if (ageMs > 3 * 24 * 60 * 60 * 1000) {
    await refreshAllRates();
  }
}

export const PTAX_DIRECT_CURRENCIES = BCB_DIRECT;
