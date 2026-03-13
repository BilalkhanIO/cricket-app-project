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
      fielderIds,
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
        batsmanId: batsmanId || null,
        bowlerId: bowlerId || null,
        runs: runs || 0,
        isWicket: isWicket || false,
        wicketType: wicketType || null,
        fielderIds: fielderIds || null,
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

    // --- Update innings totals ---
    const inningsUpdate: any = {
      totalRuns: { increment: totalRuns },
      extras: { increment: extraRuns || 0 },
    };
    if (isLegalBall) inningsUpdate.totalBalls = { increment: 1 };
    if (isWicket) inningsUpdate.totalWickets = { increment: 1 };

    // Extras breakdown
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

    // --- Update over stats ---
    const overUpdate: any = { runs: { increment: totalRuns } };
    if (isWicket) overUpdate.wickets = { increment: 1 };

    const updatedOver = await prisma.over.update({
      where: { id: overId },
      data: overUpdate,
      include: { balls: true },
    });

    // Count legal balls in this over to detect completion
    const legalBallsInOver = updatedOver.balls.filter(
      (b) => !b.isExtra || b.extraType === "BYE" || b.extraType === "LEG_BYE"
    ).length;

    if (legalBallsInOver >= 6 && !updatedOver.isCompleted) {
      // Detect maiden: 0 batting runs off bowler (excluding byes/leg byes)
      const overBowlerRuns = updatedOver.balls.reduce((s, b) => {
        if (b.extraType === "BYE" || b.extraType === "LEG_BYE") return s;
        return s + b.runs + b.extraRuns;
      }, 0);
      const isMaiden = overBowlerRuns === 0;

      await prisma.over.update({
        where: { id: overId },
        data: { isCompleted: true, isMaiden },
      });

      // Increment maiden count for bowler
      if (isMaiden && bowlerId) {
        await prisma.bowlingScorecard.updateMany({
          where: { inningsId, playerId: bowlerId },
          data: { maidens: { increment: 1 } },
        });
      }
    }

    // Update totalOvers on innings
    const newTotalBalls = innings.totalBalls;
    const totalOvers = Math.floor(newTotalBalls / 6) + (newTotalBalls % 6) / 10;
    await prisma.innings.update({
      where: { id: inningsId },
      data: { totalOvers },
    });

    // --- Update batting scorecard ---
    const countsBatRuns = !isExtra || extraType === "NO_BALL";
    if (batsmanId && countsBatRuns) {
      const existingBatting = await prisma.battingScorecard.findFirst({
        where: { inningsId, playerId: batsmanId },
      });

      const batRuns = isSix ? 6 : isBoundary ? 4 : (runs || 0);

      if (existingBatting) {
        await prisma.battingScorecard.update({
          where: { id: existingBatting.id },
          data: {
            runs: { increment: batRuns },
            balls: { increment: 1 },
            fours: isBoundary && !isSix ? { increment: 1 } : undefined,
            sixes: isSix ? { increment: 1 } : undefined,
            ...(isWicket && {
              isOut: true,
              wicketType: wicketType || null,
              bowlerId: bowlerId || null,
              fielderId: fielderIds || null,
            }),
          },
        });
      } else {
        await prisma.battingScorecard.create({
          data: {
            inningsId,
            playerId: batsmanId,
            runs: batRuns,
            balls: 1,
            fours: isBoundary && !isSix ? 1 : 0,
            sixes: isSix ? 1 : 0,
            battingOrder: 1,
            isOut: isWicket || false,
            wicketType: wicketType || null,
            bowlerId: bowlerId || null,
            fielderId: fielderIds || null,
          },
        });
      }
    }

    // --- Update bowling scorecard ---
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

      // Update bowler's overs (recalculate from all legal balls in innings)
      if (isLegalBall) {
        const bowlerBalls = await prisma.ballEvent.findMany({
          where: { inningsId, bowlerId },
          select: { isExtra: true, extraType: true },
        });
        const legalBowled = bowlerBalls.filter(
          (b) => !b.isExtra || b.extraType === "BYE" || b.extraType === "LEG_BYE"
        ).length;
        const bowlerOvers = Math.floor(legalBowled / 6) + (legalBowled % 6) / 10;

        await prisma.bowlingScorecard.updateMany({
          where: { inningsId, playerId: bowlerId },
          data: { overs: bowlerOvers },
        });
      }
    }

    // --- Auto-detect match completion ---
    const match = innings.match;
    const currentInnings = innings;
    const maxBalls = match.overs * 6;

    let matchCompleted = false;
    let result = "";
    let winnerTeamId: string | null = null;
    let winMargin = 0;
    let winType = "";

    const allOut = currentInnings.totalWickets >= 10;
    const oversComplete = currentInnings.totalBalls >= maxBalls;

    if (currentInnings.inningsNumber === 2) {
      const firstInnings = match.innings.find((i) => i.inningsNumber === 1);
      if (firstInnings) {
        const target = firstInnings.totalRuns + 1;
        if (currentInnings.totalRuns >= target) {
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
      await prisma.innings.update({
        where: { id: inningsId },
        data: { isCompleted: true },
      });

      const completedMatch = await prisma.match.update({
        where: { id: match.id },
        data: { status: "COMPLETED", result, winnerTeamId, winMargin, winType },
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
          update: { matchesPlayed: { increment: 1 }, losses: { increment: 1 } },
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

      // Auto-update PlayerStats for all players in this match
      await updatePlayerStats(completedMatch.innings, match.leagueId);

      await prisma.notification.create({
        data: {
          userId: session.user.id,
          matchId: match.id,
          type: "RESULT_DECLARED",
          title: "Match Completed",
          message: result,
        },
      }).catch(() => {});
    }

    // Calculate run rates
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

    const currentRunRate =
      currentInnings.totalBalls > 0
        ? (currentInnings.totalRuns / currentInnings.totalBalls) * 6
        : 0;

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

// Helper: aggregate and upsert PlayerStats for all players after match completion
async function updatePlayerStats(
  innings: Array<{
    teamId: string;
    battingScores: Array<{
      playerId: string; runs: number; balls: number; fours: number; sixes: number;
      isOut: boolean; wicketType: string | null;
    }>;
    bowlingScores: Array<{
      playerId: string; overs: number; maidens: number; runs: number;
      wickets: number; wides: number; noBalls: number;
    }>;
  }>,
  leagueId: string
) {
  // Collect per-player stats from this match
  const playerMap = new Map<string, {
    runs: number; balls: number; fours: number; sixes: number; isOut: boolean;
    wickets: number; oversBowled: number; runsConceded: number; maidens: number;
    batted: boolean; bowled: boolean;
  }>();

  const ensure = (pid: string) => {
    if (!playerMap.has(pid)) {
      playerMap.set(pid, {
        runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false,
        wickets: 0, oversBowled: 0, runsConceded: 0, maidens: 0,
        batted: false, bowled: false,
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
      p.bowled = true;
    }
  }

  for (const [playerId, stats] of playerMap) {
    const sr = stats.balls > 0 ? parseFloat(((stats.runs / stats.balls) * 100).toFixed(2)) : 0;
    const eco = stats.oversBowled > 0 ? parseFloat((stats.runsConceded / stats.oversBowled).toFixed(2)) : 0;

    // League-specific stats
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
    } catch (_) { /* skip individual player errors */ }
  }
}
