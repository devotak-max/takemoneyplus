import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "./cap";

const cpfDigits = (v: string) => v.replace(/\D/g, "");

export function isValidCpf(raw: string): boolean {
  const cpf = cpfDigits(raw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcDigit = (slice: string, factor: number) => {
    let sum = 0;
    for (const ch of slice) {
      sum += Number(ch) * factor--;
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const d1 = calcDigit(cpf.slice(0, 9), 10);
  const d2 = calcDigit(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

export const SignupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(100),
  fullName: z.string().min(2).max(120),
  cpf: z
    .string()
    .transform(cpfDigits)
    .refine(isValidCpf, "CPF inválido"),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10 && v.length <= 11, "Telefone inválido"),
  city: z.string().min(2).max(80),
});

export const LoginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(100),
});

const currencyEnum = z.enum(SUPPORTED_CURRENCIES);

export const CreateAdSchema = z.object({
  currency: currencyEnum,
  amount: z.number().positive().max(10_000_000),
  unitPriceBrl: z.number().positive().max(10_000),
  city: z.string().min(2).max(80),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  validDays: z.number().int().min(1).max(30),
});

export const InterestSchema = z.object({
  adId: z.number().int().positive(),
  action: z.enum(["like", "skip"]),
});

export const DiscoverQuerySchema = z.object({
  currency: currencyEnum.optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(20000).optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});
