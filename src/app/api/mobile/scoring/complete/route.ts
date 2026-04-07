import { NextRequest } from "next/server";

import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { updatePlayerStatsForMatchScopes } from "@/lib/player-stats";
import { canScoreMatch } from "@/lib/permissions";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import prisma from "@/lib/prisma";
import { ROLE } from "@/lib/roles";
import { applyCompletedMatchStandings } from "@/lib/standings";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return optionsWithCors(req);
}

export async function POST(req: NextRequest) {
  try {
    const user = getMobileUserFromRequest(req);
    if (!user) return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });

    if (!canScoreMatch(user.role)) {
      return jsonWithCors(req, { error: "Forbidden" }, { status: 403 });
    }

    const { matchId, result, winnerTeamId, winMargin, winType, playerOfMatchId } = await req.json();

    if (user.role === ROLE.SCORER) {
      const scopedMatch = await prisma.match.findUnique({
        where: { id: matchId },
        select: { scorerId: true },
      });
      if (scopedMatch?.scorerId !== user.id) {
        return jsonWithCors(req, { error: "You are not the assigned scorer for this match" }, { status: 403 });
      }
    }

    const existingMatch = await prisma.match.findUnique({
      where: { id: matchId },
      select: { status: true },
    });
    if (!existingMatch) {
      return jsonWithCors(req, { error: "Match not found" }, { status: 404 });
    }

    const wasAlreadyCompleted = existingMatch.status === "COMPLETED";

    await prisma.innings.updateMany({
      where: { matchId, isCompleted: false },
      data: { isCompleted: true },
    });

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
      await updatePlayerStatsForMatchScopes(match.innings, match.leagueId);
      await prisma.notification.create({
        data: {
          userId: user.id,
          matchId,
          type: "RESULT_DECLARED",
          title: "Match Completed",
          message: result || "Match completed",
        },
      }).catch(() => {});
    }

    return jsonWithCors(req, { match, alreadyCompleted: wasAlreadyCompleted });
  } catch (error) {
    console.error("Mobile complete match error:", error);
    return jsonWithCors(req, { error: "Failed to complete match" }, { status: 500 });
  }
}
