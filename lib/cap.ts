export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "CHF",
  "ARS",
] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: "Dólar americano",
  EUR: "Euro",
  GBP: "Libra esterlina",
  CAD: "Dólar canadense",
  AUD: "Dólar australiano",
  JPY: "Iene japonês",
  CHF: "Franco suíço",
  ARS: "Peso argentino",
};

// Tetos por moeda equivalentes a USD 500 (Lei 14.286/2021).
// Conservadores; revisar quando integrarmos cotação ao vivo.
export const MAX_AMOUNT_PER_CURRENCY: Record<Currency, number> = {
  USD: 500,
  EUR: 460,
  GBP: 400,
  CAD: 700,
  AUD: 770,
  JPY: 78000,
  CHF: 450,
  ARS: 500000,
};

export function isSupportedCurrency(value: string): value is Currency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}
