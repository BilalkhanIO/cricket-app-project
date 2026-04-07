import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ leagues: [], teams: [], players: [], matches: [] });
  }

  const contains = { contains: q, mode: "insensitive" as const };

  const [leagues, teams, players, matches] = await Promise.all([
    prisma.league.findMany({
      where: { OR: [{ name: contains }, { season: contains }] },
      select: { id: true, name: true, season: true, status: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.team.findMany({
      where: { OR: [{ name: contains }, { shortName: contains }, { city: contains }] },
      select: { id: true, name: true, shortName: true, city: true, jerseyColor: true },
      take: 5,
      orderBy: { name: "asc" },
    }),
    prisma.player.findMany({
      where: { user: { name: contains } },
      select: {
        id: true,
        role: true,
        user: { select: { name: true } },
        team: { select: { shortName: true } },
      },
      take: 5,
      orderBy: { user: { name: "asc" } },
    }),
    prisma.match.findMany({
      where: {
        OR: [
          { homeTeam: { name: contains } },
          { homeTeam: { shortName: contains } },
          { awayTeam: { name: contains } },
          { awayTeam: { shortName: contains } },
          { league: { name: contains } },
        ],
      },
      select: {
        id: true,
        status: true,
        matchDate: true,
        homeTeam: { select: { shortName: true } },
        awayTeam: { select: { shortName: true } },
        league: { select: { name: true } },
      },
      take: 5,
      orderBy: { matchDate: "desc" },
    }),
  ]);

  return NextResponse.json({ leagues, teams, players, matches });
}
