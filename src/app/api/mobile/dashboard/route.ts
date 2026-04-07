import { NextRequest } from "next/server";

import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import prisma from "@/lib/prisma";
import { normalizeRole, ROLE } from "@/lib/roles";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return optionsWithCors(req);
}

async function getAdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    leaguesCount,
    teamsCount,
    playersCount,
    matchesCount,
    usersCount,
    pendingTeams,
    upcomingMatches,
    completedMatches,
    liveMatches,
    recentAnnouncements,
    recentAuditLogs,
    todayBallEvents,
  ] = await Promise.all([
    prisma.league.count(),
    prisma.team.count(),
    prisma.player.count(),
    prisma.match.count(),
    prisma.user.count(),
    prisma.teamLeague.count({ where: { status: "PENDING" } }),
    prisma.match.count({ where: { status: "UPCOMING" } }),
    prisma.match.count({ where: { status: "COMPLETED" } }),
    prisma.match.findMany({
      where: { status: { in: ["LIVE", "INNINGS_BREAK", "TOSS"] } },
      include: {
        homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
        awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
        league: { select: { id: true, name: true } },
        innings: {
          select: {
            id: true,
            inningsNumber: true,
            teamId: true,
            totalRuns: true,
            totalWickets: true,
            totalBalls: true,
            totalOvers: true,
            isCompleted: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
      take: 5,
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
      take: 6,
    }).catch(() => []),
    prisma.ballEvent.findMany({
      where: { createdAt: { gte: today } },
      select: { runs: true, extraRuns: true, isWicket: true },
    }).catch(() => []),
  ]);

  return {
    kind: "admin",
    stats: {
      leagues: leaguesCount,
      teams: teamsCount,
      players: playersCount,
      matches: matchesCount,
      users: usersCount,
      pendingTeams,
      upcomingMatches,
      completedMatches,
      liveMatches: liveMatches.length,
      todayRuns: todayBallEvents.reduce((sum, ball) => sum + ball.runs + ball.extraRuns, 0),
      todayWickets: todayBallEvents.filter((ball) => ball.isWicket).length,
    },
    liveMatches,
    recentAnnouncements,
    recentAuditLogs,
  };
}

async function getPlayerDashboard(userId: string) {
  const player = await prisma.player.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, profileImage: true, city: true } },
      team: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      playerStats: {
        where: { leagueId: OVERALL_LEAGUE_KEY },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      battingScores: {
        include: {
          innings: {
            include: {
              match: {
                include: {
                  league: { select: { name: true } },
                  homeTeam: { select: { shortName: true } },
                  awayTeam: { select: { shortName: true } },
                },
              },
            },
          },
        },
        orderBy: { innings: { createdAt: "desc" } },
        take: 8,
      },
      bowlingScores: {
        include: {
          innings: {
            include: {
              match: {
                include: {
                  homeTeam: { select: { shortName: true } },
                  awayTeam: { select: { shortName: true } },
                },
              },
            },
          },
        },
        orderBy: { innings: { createdAt: "desc" } },
        take: 8,
      },
      awards: {
        include: { league: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  return {
    kind: "player",
    player,
  };
}

async function getTeamManagerDashboard(userId: string) {
  const teams = await prisma.team.findMany({
    where: { managerId: userId },
    include: {
      players: {
        include: {
          user: { select: { name: true, profileImage: true, city: true } },
          playerStats: {
            where: { leagueId: OVERALL_LEAGUE_KEY },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
        orderBy: [{ isCaptain: "desc" }, { isViceCaptain: "desc" }],
      },
      leagues: {
        include: {
          league: {
            select: {
              id: true,
              name: true,
              status: true,
              season: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      },
      homeMatches: {
        where: { status: { in: ["UPCOMING", "LIVE", "INNINGS_BREAK", "TOSS"] } },
        include: {
          awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
          homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
          league: { select: { id: true, name: true } },
          innings: {
            select: {
              id: true,
              inningsNumber: true,
              teamId: true,
              totalRuns: true,
              totalWickets: true,
              totalBalls: true,
              totalOvers: true,
              isCompleted: true,
            },
          },
        },
        orderBy: { matchDate: "asc" },
        take: 5,
      },
      awayMatches: {
        where: { status: { in: ["UPCOMING", "LIVE", "INNINGS_BREAK", "TOSS"] } },
        include: {
          awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
          homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
          league: { select: { id: true, name: true } },
          innings: {
            select: {
              id: true,
              inningsNumber: true,
              teamId: true,
              totalRuns: true,
              totalWickets: true,
              totalBalls: true,
              totalOvers: true,
              isCompleted: true,
            },
          },
        },
        orderBy: { matchDate: "asc" },
        take: 5,
      },
    },
  });

  return {
    kind: "team_manager",
    teams,
  };
}

async function getScorerDashboard(userId: string) {
  const matches = await prisma.match.findMany({
    where: { scorerId: userId },
    include: {
      homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
      league: { select: { id: true, name: true } },
      venue: { select: { name: true, city: true } },
      innings: {
        include: { team: { select: { shortName: true } } },
        orderBy: { inningsNumber: "asc" },
      },
    },
    orderBy: { matchDate: "desc" },
    take: 50,
  });

  return {
    kind: "scorer",
    live: matches.filter((match) => match.status === "LIVE" || match.status === "INNINGS_BREAK"),
    upcoming: matches.filter((match) => match.status === "UPCOMING" || match.status === "TOSS"),
    completed: matches.filter((match) => match.status === "COMPLETED"),
  };
}

async function getTeamStaffDashboard() {
  const [teams, liveMatches, activeLeagues] = await Promise.all([
    prisma.team.count(),
    prisma.match.count({ where: { status: { in: ["LIVE", "INNINGS_BREAK", "TOSS"] } } }),
    prisma.league.count({ where: { status: { in: ["REGISTRATION", "ACTIVE"] } } }),
  ]);

  return {
    kind: "team_staff",
    overview: { teams, liveMatches, activeLeagues },
  };
}

async function getOfficialsDashboard() {
  const [upcomingMatches, liveMatches, recordedOfficials, recentMatches] = await Promise.all([
    prisma.match.count({ where: { status: { in: ["UPCOMING", "TOSS"] } } }),
    prisma.match.count({ where: { status: { in: ["LIVE", "INNINGS_BREAK"] } } }),
    prisma.matchOfficial.count(),
    prisma.match.findMany({
      where: { status: { in: ["UPCOMING", "LIVE", "TOSS"] } },
      include: {
        homeTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
        awayTeam: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
        league: { select: { id: true, name: true } },
        venue: { select: { city: true, name: true } },
        officials: true,
        innings: {
          select: {
            id: true,
            inningsNumber: true,
            teamId: true,
            totalRuns: true,
            totalWickets: true,
            totalBalls: true,
            totalOvers: true,
            isCompleted: true,
          },
        },
      },
      orderBy: { matchDate: "asc" },
      take: 8,
    }),
  ]);

  return {
    kind: "officials",
    overview: { upcomingMatches, liveMatches, recordedOfficials },
    recentMatches,
  };
}

async function getLeagueStaffDashboard() {
  const [leagues, matches, venues, announcements] = await Promise.all([
    prisma.league.count(),
    prisma.match.count({ where: { status: { in: ["UPCOMING", "LIVE", "TOSS", "INNINGS_BREAK"] } } }),
    prisma.venue.count(),
    prisma.announcement.count(),
  ]);

  return {
    kind: "league_staff",
    overview: { leagues, matches, venues, announcements },
  };
}

export async function GET(req: NextRequest) {
  try {
    const authUser = getMobileUserFromRequest(req);
    if (!authUser) {
      return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });
    }

    const baseUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, name: true, role: true },
    });

    if (!baseUser) {
      return jsonWithCors(req, { error: "User not found" }, { status: 404 });
    }

    const normalizedRole = normalizeRole(baseUser.role);
    let dashboard;
    switch (normalizedRole) {
      case ROLE.SUPER_ADMIN:
      case ROLE.LEAGUE_ADMIN:
        dashboard = await getAdminDashboard();
        break;
      case ROLE.PLAYER:
        dashboard = await getPlayerDashboard(baseUser.id);
        break;
      case ROLE.TEAM_MANAGER:
        dashboard = await getTeamManagerDashboard(baseUser.id);
        break;
      case ROLE.SCORER:
        dashboard = await getScorerDashboard(baseUser.id);
        break;
      case ROLE.UMPIRE:
        dashboard = await getOfficialsDashboard();
        break;
      default:
        dashboard = { kind: "generic", overview: {} };
        break;
    }

    return jsonWithCors(req, {
      user: baseUser,
      dashboard,
    });
  } catch {
    return jsonWithCors(req, { error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
