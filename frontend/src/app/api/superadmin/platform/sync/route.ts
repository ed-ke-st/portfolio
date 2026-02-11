import { NextRequest, NextResponse } from "next/server";
import { buildEdgePlatformConfig, normalizePlatformHero, PlatformHeroSettings } from "@/lib/platform-config";
import { requireSuperAdminFromRequest } from "@/lib/server/super-admin-auth";

export const runtime = "nodejs";

interface SyncRequestBody {
  hero?: Partial<PlatformHeroSettings>;
}

export async function POST(req: NextRequest) {
  try {
    await requireSuperAdminFromRequest(req);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ detail: msg }, { status: msg === "Super admin access required" ? 403 : 401 });
  }

  const vercelToken = process.env.VERCEL_API_TOKEN;
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!vercelToken || !edgeConfigId) {
    return NextResponse.json({
      synced: false,
      reason: "Edge Config sync not configured (set VERCEL_API_TOKEN and EDGE_CONFIG_ID).",
    });
  }

  let body: SyncRequestBody;
  try {
    body = (await req.json()) as SyncRequestBody;
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const hero = normalizePlatformHero(body.hero);
  const platformPayload = buildEdgePlatformConfig(hero);

  const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
  const url = `https://api.vercel.com/v1/edge-config/${encodeURIComponent(edgeConfigId)}/items${query}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          operation: "upsert",
          key: "platform",
          value: platformPayload,
        },
      ],
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    return NextResponse.json(
      { detail: `Edge Config sync failed (${response.status}): ${responseText}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ synced: true });
}
