/**
 * GET /api/artist-graph/:slug?depth=1|2
 *
 * Graph traversal — returns direct connections (depth=1) and
 * optionally second-degree connections (depth=2) for an artist slug.
 * Also returns the artist's appearance history for the timeline.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const targetSlug = req.query.slug as string;
  const depth = Math.min(parseInt((req.query.depth as string) ?? "1"), 2);

  const [asA, asB] = await Promise.all([
    get("artist_connections", `?artist_a_slug=eq.${targetSlug}&order=strength.desc&limit=20`) as Promise<any[]>,
    get("artist_connections", `?artist_b_slug=eq.${targetSlug}&order=strength.desc&limit=20`) as Promise<any[]>,
  ]);
  const directConnections: any[] = [...(asA ?? []), ...(asB ?? [])];

  const connectedSlugs = new Set<string>();
  for (const conn of directConnections) {
    connectedSlugs.add(conn.artist_a_slug === targetSlug ? conn.artist_b_slug : conn.artist_a_slug);
  }

  let secondDegree: any[] = [];
  if (depth >= 2 && connectedSlugs.size > 0) {
    const slugList = [...connectedSlugs].slice(0, 8).join(",");
    secondDegree = ((await get(
      "artist_connections",
      `?artist_a_slug=in.(${slugList})&limit=30`,
    )) as any[]).filter(
      (c: any) => c.artist_a_slug !== targetSlug && c.artist_b_slug !== targetSlug,
    );
  }

  const appearances = await get(
    "event_appearances",
    `?artist_slug=eq.${targetSlug}&order=event_date.desc&limit=50`,
  );

  return res.json({
    target_slug: targetSlug,
    connections: directConnections,
    second_degree: secondDegree,
    appearances,
  });
}
