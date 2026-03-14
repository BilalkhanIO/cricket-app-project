import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leagueId = searchParams.get("leagueId");
    const type = searchParams.get("type") || "batting";

    if (type === "batting") {
      const batters = await prisma.playerStats.findMany({
        where: leagueId ? { leagueId } : { leagueId: OVERALL_LEAGUE_KEY },
        include: {
          player: {
            include: {
              user: { select: { name: true, profileImage: true } },
              team: { select: { name: true, shortName: true } },
            },
          },
        },
        orderBy: { runs: "desc" },
        take: 20,
      });
      return NextResponse.json({ data: batters });
    }

    if (type === "bowling") {
      const bowlers = await prisma.playerStats.findMany({
        where: {
          ...(leagueId ? { leagueId } : { leagueId: OVERALL_LEAGUE_KEY }),
          wickets: { gt: 0 },
        },
        include: {
          player: {
            include: {
              user: { select: { name: true, profileImage: true } },
              team: { select: { name: true, shortName: true } },
            },
          },
        },
        orderBy: { wickets: "desc" },
        take: 20,
      });
      return NextResponse.json({ data: bowlers });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
