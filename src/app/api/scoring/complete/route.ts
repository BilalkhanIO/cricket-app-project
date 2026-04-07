import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updatePlayerStatsForMatchScopes } from "@/lib/player-stats";
import { canScoreMatch } from "@/lib/permissions";
import { ROLE } from "@/lib/roles";
import { applyCompletedMatchStandings } from "@/lib/standings";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!canScoreMatch(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { matchId, result, winnerTeamId, winMargin, winType, playerOfMatchId } = await req.json();

    // Verify SCORER is assigned to this match
    if (session.user.role === ROLE.SCORER) {
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
    if (!wasAlreadyCompleted && match.leagueId) {
      await applyCompletedMatchStandings({
        leagueId: match.leagueId,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        winnerTeamId: match.winnerTeamId,
        winType: match.winType,
        result: match.result,
        league: {
          id: match.league.id,
          pointsPerWin: match.league.pointsPerWin,
          pointsPerTie: match.league.pointsPerTie,
          pointsPerNoResult: match.league.pointsPerNoResult,
        },
        innings: match.innings.map((innings) => ({
          teamId: innings.teamId,
          totalRuns: innings.totalRuns,
          totalBalls: innings.totalBalls,
        })),
      });
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
