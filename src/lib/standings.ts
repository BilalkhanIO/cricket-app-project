import prisma from "@/lib/prisma";
import { calcNRR } from "@/lib/utils";

type LeaguePointsConfig = {
  id: string;
  pointsPerWin: number;
  pointsPerTie: number;
  pointsPerNoResult: number;
};

type MatchInningsSummary = {
  teamId: string;
  totalRuns: number;
  totalBalls: number;
};

type CompletedMatchSummary = {
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  winnerTeamId: string | null;
  winType: string | null;
  result: string | null;
  league: LeaguePointsConfig;
  innings: MatchInningsSummary[];
};

type MatchOutcome = "WIN" | "TIE" | "NO_RESULT";

function inferOutcome(match: Pick<CompletedMatchSummary, "winnerTeamId" | "winType" | "result">): MatchOutcome {
  if (match.winnerTeamId) return "WIN";

  const normalizedWinType = (match.winType || "").trim().toUpperCase();
  const normalizedResult = (match.result || "").trim().toUpperCase();

  if (normalizedWinType === "TIE" || normalizedResult.includes("TIE")) {
    return "TIE";
  }

  return "NO_RESULT";
}

function createPointsTableBase(leagueId: string, teamId: string) {
  return {
    leagueId,
    teamId,
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    noResults: 0,
    points: 0,
    netRunRate: 0,
    runsScored: 0,
    oversFaced: 0,
    runsConceded: 0,
    oversBowled: 0,
  };
}

async function upsertPointsTableMatchResult(
  leagueId: string,
  teamId: string,
  update: Record<string, { increment: number }>
) {
  return prisma.pointsTable.upsert({
    where: { leagueId_teamId: { leagueId, teamId } },
    update,
    create: {
      ...createPointsTableBase(leagueId, teamId),
      matchesPlayed: update.matchesPlayed?.increment || 0,
      wins: update.wins?.increment || 0,
      losses: update.losses?.increment || 0,
      ties: update.ties?.increment || 0,
      noResults: update.noResults?.increment || 0,
      points: update.points?.increment || 0,
    },
  });
}

async function applyNetRunRateForTeam(
  leagueId: string,
  teamId: string,
  battingInnings: MatchInningsSummary | undefined,
  bowlingInnings: MatchInningsSummary | undefined
) {
  if (!battingInnings || !bowlingInnings || battingInnings.totalBalls <= 0 || bowlingInnings.totalBalls <= 0) {
    return;
  }

  const updatedRow = await prisma.pointsTable.upsert({
    where: { leagueId_teamId: { leagueId, teamId } },
    update: {
      runsScored: { increment: battingInnings.totalRuns },
      oversFaced: { increment: battingInnings.totalBalls / 6 },
      runsConceded: { increment: bowlingInnings.totalRuns },
      oversBowled: { increment: bowlingInnings.totalBalls / 6 },
    },
    create: {
      ...createPointsTableBase(leagueId, teamId),
      runsScored: battingInnings.totalRuns,
      oversFaced: battingInnings.totalBalls / 6,
      runsConceded: bowlingInnings.totalRuns,
      oversBowled: bowlingInnings.totalBalls / 6,
    },
  });

  const nextNrr =
    updatedRow.oversFaced > 0 && updatedRow.oversBowled > 0
      ? calcNRR(updatedRow.runsScored, updatedRow.oversFaced, updatedRow.runsConceded, updatedRow.oversBowled)
      : 0;

  await prisma.pointsTable.update({
    where: { id: updatedRow.id },
    data: { netRunRate: nextNrr },
  });
}

export async function applyCompletedMatchStandings(match: CompletedMatchSummary) {
  const outcome = inferOutcome(match);
  const { leagueId, homeTeamId, awayTeamId } = match;

  if (outcome === "WIN" && match.winnerTeamId) {
    const loserTeamId = match.winnerTeamId === homeTeamId ? awayTeamId : homeTeamId;

    await upsertPointsTableMatchResult(leagueId, match.winnerTeamId, {
      matchesPlayed: { increment: 1 },
      wins: { increment: 1 },
      points: { increment: match.league.pointsPerWin },
    });

    await upsertPointsTableMatchResult(leagueId, loserTeamId, {
      matchesPlayed: { increment: 1 },
      losses: { increment: 1 },
    });
  } else if (outcome === "TIE") {
    for (const teamId of [homeTeamId, awayTeamId]) {
      await upsertPointsTableMatchResult(leagueId, teamId, {
        matchesPlayed: { increment: 1 },
        ties: { increment: 1 },
        points: { increment: match.league.pointsPerTie },
      });
    }
  } else {
    for (const teamId of [homeTeamId, awayTeamId]) {
      await upsertPointsTableMatchResult(leagueId, teamId, {
        matchesPlayed: { increment: 1 },
        noResults: { increment: 1 },
        points: { increment: match.league.pointsPerNoResult },
      });
    }
  }

  const homeBatting = match.innings.find((inning) => inning.teamId === homeTeamId);
  const awayBatting = match.innings.find((inning) => inning.teamId === awayTeamId);

  await applyNetRunRateForTeam(leagueId, homeTeamId, homeBatting, awayBatting);
  await applyNetRunRateForTeam(leagueId, awayTeamId, awayBatting, homeBatting);
}
