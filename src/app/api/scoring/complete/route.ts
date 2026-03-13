import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calcNRR } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canScore = ["SUPER_ADMIN", "LEAGUE_ADMIN", "SCORER"].includes(session.user.role);
    if (!canScore) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { matchId, result, winnerTeamId, winMargin, winType, playerOfMatchId } = await req.json();

    // Complete any incomplete innings
    await prisma.innings.updateMany({
      where: { matchId, isCompleted: false },
      data: { isCompleted: true },
    });

    // Update match
    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "COMPLETED",
        result: result || null,
        winnerTeamId: winnerTeamId || null,
        winMargin: winMargin || null,
        winType: winType || null,
        playerOfMatchId: playerOfMatchId || null,
      },
      include: {
        league: true,
        innings: {
          include: {
            battingScores: true,
            bowlingScores: true,
          },
        },
      },
    });

    // Create Man of the Match award if playerOfMatchId provided
    if (playerOfMatchId && match.leagueId) {
      // Find the player record
      await prisma.award.create({
        data: {
          leagueId: match.leagueId,
          matchId,
          playerId: playerOfMatchId,
          awardType: "MAN_OF_MATCH",
          description: `Man of the Match – ${result || ""}`,
          isAutoCalc: false,
        },
      }).catch(() => {}); // don't fail if award already exists
    }

    // Update points table
    if (winnerTeamId && match.leagueId) {
      const loserTeamId =
        match.homeTeamId === winnerTeamId ? match.awayTeamId : match.homeTeamId;

      await prisma.pointsTable.upsert({
        where: { leagueId_teamId: { leagueId: match.leagueId, teamId: winnerTeamId } },
        update: {
          matchesPlayed: { increment: 1 },
          wins: { increment: 1 },
          points: { increment: match.league.pointsPerWin },
        },
        create: {
          leagueId: match.leagueId,
          teamId: winnerTeamId,
          matchesPlayed: 1,
          wins: 1,
          points: match.league.pointsPerWin,
        },
      });

      await prisma.pointsTable.upsert({
        where: { leagueId_teamId: { leagueId: match.leagueId, teamId: loserTeamId } },
        update: { matchesPlayed: { increment: 1 }, losses: { increment: 1 } },
        create: {
          leagueId: match.leagueId,
          teamId: loserTeamId,
          matchesPlayed: 1,
          losses: 1,
          points: 0,
        },
      });

      // Recalculate NRR for both teams
      for (const teamId of [match.homeTeamId, match.awayTeamId]) {
        const battingInnings = match.innings.find((i) => i.teamId === teamId);
        const bowlingInnings = match.innings.find((i) => i.teamId !== teamId);

        if (battingInnings && bowlingInnings && battingInnings.totalBalls > 0) {
          const runsScored = battingInnings.totalRuns;
          const oversFaced = battingInnings.totalBalls / 6;
          const runsConceded = bowlingInnings.totalRuns;
          const oversBowled = bowlingInnings.totalBalls / 6;

          if (oversFaced > 0 && oversBowled > 0) {
            await prisma.pointsTable.update({
              where: { leagueId_teamId: { leagueId: match.leagueId, teamId } },
              data: {
                runsScored: { increment: runsScored },
                oversFaced: { increment: oversFaced },
                runsConceded: { increment: runsConceded },
                oversBowled: { increment: oversBowled },
                netRunRate: calcNRR(runsScored, oversFaced, runsConceded, oversBowled),
              },
            });
          }
        }
      }
    }

    // Auto-update PlayerStats for all players in this match
    await updateAllPlayerStats(match.innings, match.leagueId);

    // Notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        matchId,
        type: "RESULT_DECLARED",
        title: "Match Completed",
        message: result || "Match completed",
      },
    }).catch(() => {});

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Complete match error:", error);
    return NextResponse.json({ error: "Failed to complete match" }, { status: 500 });
  }
}

async function updateAllPlayerStats(
  innings: Array<{
    teamId: string;
    battingScores: Array<{
      playerId: string; runs: number; balls: number; fours: number; sixes: number;
      isOut: boolean;
    }>;
    bowlingScores: Array<{
      playerId: string; overs: number; maidens: number; runs: number;
      wickets: number; wides: number; noBalls: number;
    }>;
  }>,
  leagueId: string
) {
  const playerMap = new Map<string, {
    runs: number; balls: number; fours: number; sixes: number; isOut: boolean;
    wickets: number; oversBowled: number; runsConceded: number; maidens: number;
    batted: boolean;
  }>();

  const ensure = (pid: string) => {
    if (!playerMap.has(pid)) {
      playerMap.set(pid, {
        runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false,
        wickets: 0, oversBowled: 0, runsConceded: 0, maidens: 0,
        batted: false,
      });
    }
    return playerMap.get(pid)!;
  };

  for (const inn of innings) {
    for (const bat of inn.battingScores) {
      const p = ensure(bat.playerId);
      p.runs += bat.runs;
      p.balls += bat.balls;
      p.fours += bat.fours;
      p.sixes += bat.sixes;
      if (bat.isOut) p.isOut = true;
      p.batted = true;
    }
    for (const bowl of inn.bowlingScores) {
      const p = ensure(bowl.playerId);
      p.wickets += bowl.wickets;
      p.oversBowled += bowl.overs;
      p.runsConceded += bowl.runs;
      p.maidens += bowl.maidens;
    }
  }

  for (const [playerId, stats] of playerMap) {
    const sr = stats.balls > 0 ? parseFloat(((stats.runs / stats.balls) * 100).toFixed(2)) : 0;
    const eco = stats.oversBowled > 0 ? parseFloat((stats.runsConceded / stats.oversBowled).toFixed(2)) : 0;

    try {
      await prisma.playerStats.upsert({
        where: { playerId_leagueId: { playerId, leagueId } },
        update: {
          matchesPlayed: { increment: 1 },
          innings: { increment: stats.batted ? 1 : 0 },
          runs: { increment: stats.runs },
          ballsFaced: { increment: stats.balls },
          fours: { increment: stats.fours },
          sixes: { increment: stats.sixes },
          wickets: { increment: stats.wickets },
          oversBowled: { increment: stats.oversBowled },
          runsConceded: { increment: stats.runsConceded },
          maidens: { increment: stats.maidens },
          strikeRate: sr,
          economy: eco,
          updatedAt: new Date(),
        },
        create: {
          playerId,
          leagueId,
          matchesPlayed: 1,
          innings: stats.batted ? 1 : 0,
          runs: stats.runs,
          ballsFaced: stats.balls,
          fours: stats.fours,
          sixes: stats.sixes,
          highestScore: stats.runs,
          strikeRate: sr,
          wickets: stats.wickets,
          oversBowled: stats.oversBowled,
          runsConceded: stats.runsConceded,
          maidens: stats.maidens,
          economy: eco,
          updatedAt: new Date(),
        },
      });
    } catch (_) { /* skip individual errors */ }
  }
}
