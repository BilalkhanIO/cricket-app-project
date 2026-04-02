import { NextRequest } from "next/server";

import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { updatePlayerStatsForMatchScopes } from "@/lib/player-stats";
import { canScoreMatch } from "@/lib/permissions";
import { calcNRR } from "@/lib/utils";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import prisma from "@/lib/prisma";
import { ROLE } from "@/lib/roles";

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

    if (!wasAlreadyCompleted && winnerTeamId && match.leagueId) {
      const loserTeamId = match.homeTeamId === winnerTeamId ? match.awayTeamId : match.homeTeamId;

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

      for (const teamId of [match.homeTeamId, match.awayTeamId]) {
        const battingInnings = match.innings.find((innings) => innings.teamId === teamId);
        const bowlingInnings = match.innings.find((innings) => innings.teamId !== teamId);

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
