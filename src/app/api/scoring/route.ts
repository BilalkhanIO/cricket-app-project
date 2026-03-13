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

    const {
      inningsId,
      overId,
      ballNumber,
      overNumber,
      batsmanId,
      bowlerId,
      runs,
      isWicket,
      wicketType,
      isExtra,
      extraType,
      extraRuns,
      isBoundary,
      isSix,
      commentary,
    } = await req.json();

    // Create ball event
    const ball = await prisma.ballEvent.create({
      data: {
        inningsId,
        overId,
        ballNumber,
        overNumber,
        batsmanId,
        bowlerId,
        runs: runs || 0,
        isWicket: isWicket || false,
        wicketType: wicketType || null,
        isExtra: isExtra || false,
        extraType: extraType || null,
        extraRuns: extraRuns || 0,
        isBoundary: isBoundary || false,
        isSix: isSix || false,
        commentary: commentary || null,
      },
    });

    const totalRuns = (runs || 0) + (extraRuns || 0);
    const isLegalBall = !isExtra || extraType === "BYE" || extraType === "LEG_BYE";

    // Update innings totals
    const inningsUpdate: any = {
      totalRuns: { increment: totalRuns },
      extras: { increment: extraRuns || 0 },
    };

    if (isLegalBall) {
      inningsUpdate.totalBalls = { increment: 1 };
    }

    if (isWicket) {
      inningsUpdate.totalWickets = { increment: 1 };
    }

    if (extraType === "WIDE") inningsUpdate.wides = { increment: extraRuns || 0 };
    if (extraType === "NO_BALL") inningsUpdate.noBalls = { increment: 1 };
    if (extraType === "BYE") inningsUpdate.byes = { increment: extraRuns || 0 };
    if (extraType === "LEG_BYE") inningsUpdate.legByes = { increment: extraRuns || 0 };

    const innings = await prisma.innings.update({
      where: { id: inningsId },
      data: inningsUpdate,
      include: {
        match: {
          include: {
            league: true,
            innings: true,
            homeTeam: { select: { id: true, name: true } },
            awayTeam: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Update over stats
    const overUpdate: any = {
      runs: { increment: totalRuns },
    };
    if (isWicket) overUpdate.wickets = { increment: 1 };

    // Auto-detect over completion (6 legal deliveries)
    const updatedOver = await prisma.over.update({
      where: { id: overId },
      data: overUpdate,
      include: { balls: true },
    });

    // Count legal balls in this over
    const legalBallsInOver = updatedOver.balls.filter(
      (b) => !b.isExtra || b.extraType === "BYE" || b.extraType === "LEG_BYE"
    ).length;

    if (legalBallsInOver >= 6 && !updatedOver.isCompleted) {
      await prisma.over.update({
        where: { id: overId },
        data: { isCompleted: true },
      });
    }

    // Update total overs on innings
    const newTotalBalls = innings.totalBalls;
    const totalOvers = Math.floor(newTotalBalls / 6) + (newTotalBalls % 6) / 10;
    await prisma.innings.update({
      where: { id: inningsId },
      data: { totalOvers },
    });

    // Update batting scorecard
    if (batsmanId && (!isExtra || extraType === "NO_BALL")) {
      const existingBatting = await prisma.battingScorecard.findFirst({
        where: { inningsId, playerId: batsmanId },
      });

      if (existingBatting) {
        await prisma.battingScorecard.update({
          where: { id: existingBatting.id },
          data: {
            runs: { increment: isBoundary && !isExtra ? 4 : isSix ? 6 : runs || 0 },
            balls: { increment: 1 },
            fours: isBoundary && !isSix && !isExtra ? { increment: 1 } : undefined,
            sixes: isSix ? { increment: 1 } : undefined,
            ...(isWicket && {
              isOut: true,
              wicketType,
              bowlerId: bowlerId || null,
            }),
          },
        });
      } else {
        await prisma.battingScorecard.create({
          data: {
            inningsId,
            playerId: batsmanId,
            runs: runs || 0,
            balls: 1,
            fours: isBoundary && !isSix ? 1 : 0,
            sixes: isSix ? 1 : 0,
            battingOrder: 1,
            isOut: isWicket || false,
            wicketType: wicketType || null,
            bowlerId: bowlerId || null,
          },
        });
      }
    }

    // Update bowling scorecard
    if (bowlerId) {
      const existingBowling = await prisma.bowlingScorecard.findFirst({
        where: { inningsId, playerId: bowlerId },
      });

      if (existingBowling) {
        await prisma.bowlingScorecard.update({
          where: { id: existingBowling.id },
          data: {
            runs: { increment: totalRuns },
            wickets: isWicket ? { increment: 1 } : undefined,
            wides: extraType === "WIDE" ? { increment: 1 } : undefined,
            noBalls: extraType === "NO_BALL" ? { increment: 1 } : undefined,
          },
        });
      } else {
        await prisma.bowlingScorecard.create({
          data: {
            inningsId,
            playerId: bowlerId,
            runs: totalRuns,
            wickets: isWicket ? 1 : 0,
            wides: extraType === "WIDE" ? 1 : 0,
            noBalls: extraType === "NO_BALL" ? 1 : 0,
          },
        });
      }
    }

    // Auto-detect match completion conditions
    const match = innings.match;
    const currentInnings = innings;
    const oversPerInnings = match.overs;
    const maxBalls = oversPerInnings * 6;

    let matchCompleted = false;
    let result = "";
    let winnerTeamId: string | null = null;
    let winMargin = 0;
    let winType = "";

    // All out (10 wickets)
    const allOut = currentInnings.totalWickets >= 10;

    // Overs complete
    const oversComplete = currentInnings.totalBalls >= maxBalls;

    if (currentInnings.inningsNumber === 2) {
      // 2nd innings: check if target achieved
      const firstInnings = match.innings.find((i) => i.inningsNumber === 1);
      if (firstInnings) {
        const target = firstInnings.totalRuns + 1;
        if (currentInnings.totalRuns >= target) {
          // Batting team won by wickets
          winnerTeamId = currentInnings.teamId;
          const wicketsLeft = 10 - currentInnings.totalWickets;
          winMargin = wicketsLeft;
          winType = "wickets";
          const winnerName =
            currentInnings.teamId === match.homeTeamId
              ? match.homeTeam?.name || "Home"
              : match.awayTeam?.name || "Away";
          result = `${winnerName} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? "s" : ""}`;
          matchCompleted = true;
        } else if (allOut || oversComplete) {
          // 2nd innings ended without chasing - bowling team won by runs
          const runsShort = target - currentInnings.totalRuns - 1;
          const bowlingTeamId =
            currentInnings.teamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
          winnerTeamId = bowlingTeamId;
          winMargin = runsShort;
          winType = "runs";
          const winnerName =
            bowlingTeamId === match.homeTeamId
              ? match.homeTeam?.name || "Home"
              : match.awayTeam?.name || "Away";
          result = `${winnerName} won by ${runsShort} run${runsShort !== 1 ? "s" : ""}`;
          matchCompleted = true;
        }
      }
    } else if (currentInnings.inningsNumber === 1) {
      // 1st innings: auto-complete when all out or overs done
      if (allOut || oversComplete) {
        await prisma.innings.update({
          where: { id: inningsId },
          data: { isCompleted: true },
        });
        await prisma.match.update({
          where: { id: match.id },
          data: { status: "INNINGS_BREAK" },
        });
      }
    }

    if (matchCompleted) {
      // Complete the innings and match
      await prisma.innings.update({
        where: { id: inningsId },
        data: { isCompleted: true },
      });

      const completedMatch = await prisma.match.update({
        where: { id: match.id },
        data: {
          status: "COMPLETED",
          result,
          winnerTeamId,
          winMargin,
          winType,
        },
        include: { league: true, innings: true },
      });

      // Update points table
      if (winnerTeamId && match.leagueId) {
        const loserTeamId =
          match.homeTeamId === winnerTeamId ? match.awayTeamId : match.homeTeamId;

        await prisma.pointsTable.upsert({
          where: { leagueId_teamId: { leagueId: match.leagueId, teamId: winnerTeamId } },
          update: {
            matchesPlayed: { increment: 1 },
            wins: { increment: 1 },
            points: { increment: completedMatch.league.pointsPerWin },
          },
          create: {
            leagueId: match.leagueId,
            teamId: winnerTeamId,
            matchesPlayed: 1,
            wins: 1,
            points: completedMatch.league.pointsPerWin,
          },
        });

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

        // Recalculate NRR
        for (const teamId of [match.homeTeamId, match.awayTeamId]) {
          const battingInnings = completedMatch.innings.find((i) => i.teamId === teamId);
          const bowlingInnings = completedMatch.innings.find((i) => i.teamId !== teamId);

          if (battingInnings && bowlingInnings) {
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

      // Create notification for match completion
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          matchId: match.id,
          type: "MATCH_COMPLETED",
          title: "Match Completed",
          message: result,
        },
      }).catch(() => {});
    }

    // Calculate required run rate for 2nd innings
    let requiredRunRate: number | null = null;
    if (currentInnings.inningsNumber === 2 && !matchCompleted) {
      const firstInnings = match.innings.find((i) => i.inningsNumber === 1);
      if (firstInnings) {
        const target = firstInnings.totalRuns + 1;
        const runsNeeded = target - currentInnings.totalRuns;
        const ballsLeft = maxBalls - currentInnings.totalBalls;
        if (ballsLeft > 0 && runsNeeded > 0) {
          requiredRunRate = (runsNeeded / ballsLeft) * 6;
        }
      }
    }

    // Current run rate
    const currentRunRate =
      currentInnings.totalBalls > 0
        ? (currentInnings.totalRuns / currentInnings.totalBalls) * 6
        : 0;

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        matchId: innings.matchId,
        action: "BALL_EVENT",
        entity: "BallEvent",
        entityId: ball.id,
        newValue: JSON.stringify({ runs, isWicket, extraType }),
      },
    });

    return NextResponse.json({
      ball,
      innings: { ...innings, totalOvers },
      matchCompleted,
      result: matchCompleted ? result : null,
      currentRunRate: parseFloat(currentRunRate.toFixed(2)),
      requiredRunRate: requiredRunRate ? parseFloat(requiredRunRate.toFixed(2)) : null,
    });
  } catch (error) {
    console.error("Scoring error:", error);
    return NextResponse.json({ error: "Failed to record ball event" }, { status: 500 });
  }
}
