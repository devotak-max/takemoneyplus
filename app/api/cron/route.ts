import { NextResponse } from "next/server";
import { refreshAllRates } from "@/lib/ptax";
import { renewActiveAds } from "@/lib/ads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Endpoint de manutenção: atualiza PTAX e renova anúncios.
// Proteja com header `x-cron-secret` igual a `MONETHEUS_CRON_SECRET`.
// Pode ser chamado por scheduler externo (Fly Cron, GitHub Actions, etc.).
export async function POST(request: Request) {
  const expected = process.env.MONETHEUS_CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Cron desabilitado." }, { status: 503 });
  }
  const provided = request.headers.get("x-cron-secret");
  if (provided !== expected) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const ratesResult = await refreshAllRates();
  const adsResult = renewActiveAds();
  return NextResponse.json({ ok: true, rates: ratesResult, ads: adsResult });
}
