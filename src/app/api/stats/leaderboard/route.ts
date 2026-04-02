import { NextRequest } from "next/server";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";

export const dynamic = 'force-dynamic';

export function OPTIONS(req: NextRequest) {
  return optionsWithCors(req);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leagueId = searchParams.get("leagueId");
    const type = searchParams.get("type") || "batting";
    const scope = leagueId ? { leagueId } : { leagueId: OVERALL_LEAGUE_KEY };

    const include = {
      player: {
        include: {
          user: { select: { name: true, profileImage: true } },
          team: { select: { name: true, shortName: true } },
        },
      },
    };

    if (type === "batting") {
      const data = await prisma.playerStats.findMany({
        where: scope,
        include,
        orderBy: [{ runs: "desc" }, { average: "desc" }],
        take: 20,
      });
      return jsonWithCors(req, { data });
    }

    if (type === "bowling") {
      const data = await prisma.playerStats.findMany({
        where: { ...scope, wickets: { gt: 0 } },
        include,
        orderBy: [{ wickets: "desc" }, { economy: "asc" }],
        take: 20,
      });
      return jsonWithCors(req, { data });
    }

    if (type === "sixes") {
      const data = await prisma.playerStats.findMany({
        where: { ...scope, sixes: { gt: 0 } },
        include,
        orderBy: [{ sixes: "desc" }, { strikeRate: "desc" }],
        take: 20,
      });
      return jsonWithCors(req, { data });
    }

    if (type === "fifties") {
      const data = await prisma.playerStats.findMany({
        where: { ...scope, fifties: { gt: 0 } },
        include,
        orderBy: [{ fifties: "desc" }, { runs: "desc" }],
        take: 20,
      });
      return jsonWithCors(req, { data });
    }

    if (type === "hundreds") {
      const data = await prisma.playerStats.findMany({
        where: { ...scope, hundreds: { gt: 0 } },
        include,
        orderBy: [{ hundreds: "desc" }, { highestScore: "desc" }],
        take: 20,
      });
      return jsonWithCors(req, { data });
    }

    return jsonWithCors(req, { error: "Invalid type" }, { status: 400 });
  } catch (error) {
    return jsonWithCors(req, { error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
