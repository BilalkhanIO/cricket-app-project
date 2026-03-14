import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calcNRR } from "@/lib/utils";
import { updatePlayerStatsForMatchScopes } from "@/lib/player-stats";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canScore = ["SUPER_ADMIN", "LEAGUE_ADMIN", "SCORER"].includes(session.user.role);
    if (!canScore) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { matchId, result, winnerTeamId, winMargin, winType, playerOfMatchId } = await req.json();

    // Verify SCORER is assigned to this match
    if (session.user.role === "SCORER") {
      const match = await prisma.match.findUnique({ where: { id: matchId }, select: { scorerId: true } });
      if (match?.scorerId !== session.user.id) {
        return NextResponse.json({ error: "You are not the assigned scorer for this match" }, { status: 403 });
      }
    }

    const existingMatch = await prisma.match.findUnique({
      where: { id: matchId },
      select: { status: true },
    });
    if (!existingMatch) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    const wasAlreadyCompleted = existingMatch.status === "COMPLETED";

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

    // Create or update Man of the Match award if playerOfMatchId provided
    if (playerOfMatchId && match.leagueId) {
      const existingMom = await prisma.award.findFirst({
        where: { matchId, awardType: "MAN_OF_MATCH" },
        select: { id: true },
      });
      if (existingMom) {
        await prisma.award.update({
          where: { id: existingMom.id },
          data: {
            playerId: playerOfMatchId,
            description: `Man of the Match – ${result || ""}`,
            isAutoCalc: false,
          },
        });
      } else {
        await prisma.award.create({
          data: {
            leagueId: match.leagueId,
            matchId,
            playerId: playerOfMatchId,
            awardType: "MAN_OF_MATCH",
            description: `Man of the Match – ${result || ""}`,
            isAutoCalc: false,
          },
        });
      }
    }

    // Update standings and stats only once per match completion
    if (!wasAlreadyCompleted && winnerTeamId && match.leagueId) {
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

    if (!wasAlreadyCompleted) {
      // Auto-update PlayerStats for all players in this match
      await updatePlayerStatsForMatchScopes(match.innings, match.leagueId);
    }

    // Notification
    if (!wasAlreadyCompleted) {
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          matchId,
          type: "RESULT_DECLARED",
          title: "Match Completed",
          message: result || "Match completed",
        },
      }).catch(() => {});
    }

    return NextResponse.json({ match, alreadyCompleted: wasAlreadyCompleted });
  } catch (error) {
    console.error("Complete match error:", error);
    return NextResponse.json({ error: "Failed to complete match" }, { status: 500 });
  }
}
