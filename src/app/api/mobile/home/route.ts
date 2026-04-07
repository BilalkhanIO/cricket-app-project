import { NextRequest } from "next/server";

import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";

export const dynamic = "force-dynamic";

const mobileMatchInclude = {
  homeTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
  awayTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
  venue: { select: { name: true, city: true } },
  league: { select: { id: true, name: true } },
  innings: {
    select: {
      inningsNumber: true,
      teamId: true,
      totalRuns: true,
      totalWickets: true,
      totalOvers: true,
      isCompleted: true,
    },
  },
} as const;

export function OPTIONS(req: NextRequest) {
  return optionsWithCors(req);
}

export async function GET(req: NextRequest) {
  try {
    const [
      leagueCounts,
      featuredLeagues,
      liveMatches,
      upcomingMatches,
      recentResults,
      announcements,
      setupLeagues,
      topBatters,
      topBowlers,
      totalTeams,
      totalPlayers,
      totalMatches,
    ] = await Promise.all([
      prisma.league.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.league.findMany({
        where: { status: "ACTIVE" },
        include: {
          _count: { select: { teams: true, matches: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 6,
      }),
      prisma.match.findMany({
        where: {
          status: { in: ["LIVE", "INNINGS_BREAK"] },
        },
        include: mobileMatchInclude,
        orderBy: [{ updatedAt: "desc" }],
        take: 3,
      }),
      prisma.match.findMany({
        where: {
          status: { in: ["UPCOMING", "TOSS"] },
        },
        include: mobileMatchInclude,
        orderBy: [{ matchDate: "asc" }],
        take: 5,
      }),
      prisma.match.findMany({
        where: {
          status: "COMPLETED",
        },
        include: mobileMatchInclude,
        orderBy: [{ updatedAt: "desc" }],
        take: 5,
      }),
      prisma.announcement.findMany({
        where: { isPublic: true },
        include: {
          league: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.league.findMany({
        where: { status: { in: ["DRAFT", "REGISTRATION"] } },
        select: {
          id: true,
          name: true,
          season: true,
          registrationCloseDate: true,
          poolConfigJson: true,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.playerStats.findMany({
        where: { leagueId: OVERALL_LEAGUE_KEY, runs: { gt: 0 } },
        orderBy: [{ runs: "desc" }, { average: "desc" }],
        take: 5,
        include: {
          player: {
            include: {
              user: { select: { name: true, profileImage: true } },
              team: { select: { shortName: true, jerseyColor: true } },
            },
          },
        },
      }),
      prisma.playerStats.findMany({
        where: { leagueId: OVERALL_LEAGUE_KEY, wickets: { gt: 0 } },
        orderBy: [{ wickets: "desc" }, { economy: "asc" }],
        take: 5,
        include: {
          player: {
            include: {
              user: { select: { name: true, profileImage: true } },
              team: { select: { shortName: true, jerseyColor: true } },
            },
          },
        },
      }),
      prisma.team.count(),
      prisma.player.count(),
      prisma.match.count(),
    ]);

    const leagueSummary = leagueCounts.reduce(
      (accumulator, item) => {
        accumulator.total += item._count._all;
        if (item.status === "ACTIVE") accumulator.active += item._count._all;
        if (item.status === "REGISTRATION" || item.status === "DRAFT") {
          accumulator.setup += item._count._all;
        }
        if (item.status === "COMPLETED") accumulator.completed += item._count._all;
        return accumulator;
      },
      {
        total: 0,
        active: 0,
        setup: 0,
        completed: 0,
      },
    );

    return jsonWithCors(req, {
      summary: {
        leagues: leagueSummary,
        teams: totalTeams,
        players: totalPlayers,
        matches: totalMatches,
      },
      featuredLeagues,
      liveMatches,
      upcomingMatches,
      recentResults,
      announcements,
      setupLeagues,
      topBatters,
      topBowlers,
    });
  } catch {
    return jsonWithCors(req, { error: "Failed to fetch mobile home feed" }, { status: 500 });
  }
}
