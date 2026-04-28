import { NextResponse } from "next/server";
import { ensureFreshRates, getAllLatestRates } from "@/lib/ptax";

export const runtime = "nodejs";

export async function GET() {
  await ensureFreshRates();
  return NextResponse.json({ rates: getAllLatestRates() });
}
