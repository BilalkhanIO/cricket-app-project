import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calcNRR } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { matchId, result, winnerTeamId, winMargin, winType, playerOfMatchId } = await req.json();

    // Complete current innings
    await prisma.innings.updateMany({
      where: { matchId, isCompleted: false },
      data: { isCompleted: true },
    });

    // Update match result
    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "COMPLETED",
        result,
        winnerTeamId: winnerTeamId || null,
        winMargin: winMargin || null,
        winType: winType || null,
        playerOfMatchId: playerOfMatchId || null,
      },
      include: {
        league: true,
        innings: true,
      },
    });

    // Update points table
    if (winnerTeamId && match.leagueId) {
      const loserTeamId =
        match.homeTeamId === winnerTeamId ? match.awayTeamId : match.homeTeamId;

      // Winner gets points
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

      // Loser update
      await prisma.pointsTable.upsert({
        where: { leagueId_teamId: { leagueId: match.leagueId, teamId: loserTeamId } },
        update: {
          matchesPlayed: { increment: 1 },
          losses: { increment: 1 },
        },
        create: {
          leagueId: match.leagueId,
          teamId: loserTeamId,
          matchesPlayed: 1,
          losses: 1,
          points: 0,
        },
      });

      // Recalculate NRR from innings data
      for (const teamId of [match.homeTeamId, match.awayTeamId]) {
        const battingInnings = match.innings.find(
          (i) => i.teamId === teamId
        );
        const bowlingInnings = match.innings.find(
          (i) => i.teamId !== teamId
        );

        if (battingInnings && bowlingInnings) {
          const runsScored = battingInnings.totalRuns;
          const oversFaced = battingInnings.totalBalls / 6;
          const runsConceded = bowlingInnings.totalRuns;
          const oversBowled = bowlingInnings.totalBalls / 6;

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

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Complete match error:", error);
    return NextResponse.json({ error: "Failed to complete match" }, { status: 500 });
  }
}
