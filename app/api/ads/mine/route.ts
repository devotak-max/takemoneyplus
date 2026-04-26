import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listInterestedUsers, listMyAds } from "@/lib/ads";

export const runtime = "nodejs";

export async function GET() {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const ads = listMyAds(user.id);
  const adsWithInterested = ads.map((ad) => ({
    ...ad,
    interestedUsers: listInterestedUsers(ad.id, user.id),
  }));
  return NextResponse.json({ ads: adsWithInterested });
}
