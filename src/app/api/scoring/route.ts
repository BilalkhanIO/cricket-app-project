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
    const validExtras = new Set(["WIDE", "NO_BALL", "BYE", "LEG_BYE"]);
    const validWicketTypes = new Set([
      "BOWLED",
      "CAUGHT",
      "LBW",
      "RUN_OUT",
      "STUMPED",
      "HIT_WICKET",
      "RETIRED_HURT",
      "RETIRED_OUT",
    ]);

    if (!inningsId || !overId || !ballNumber || !overNumber) {
      return NextResponse.json({ error: "Missing required scoring fields" }, { status: 400 });
    }
    if ((runs ?? 0) < 0 || (extraRuns ?? 0) < 0) {
      return NextResponse.json({ error: "Runs cannot be negative" }, { status: 400 });
    }
    if (isExtra && (!extraType || !validExtras.has(extraType))) {
      return NextResponse.json({ error: "Invalid extra type" }, { status: 400 });
    }
    if (isWicket && (!wicketType || !validWicketTypes.has(wicketType))) {
      return NextResponse.json({ error: "Invalid wicket type" }, { status: 400 });
    }
    if (isWicket && ["CAUGHT", "RUN_OUT", "STUMPED"].includes(wicketType || "") && !fielderIds) {
      return NextResponse.json({ error: "Fielder is required for selected wicket type" }, { status: 400 });
    }
    if (isWicket && extraType === "WIDE" && !["RUN_OUT", "STUMPED", "HIT_WICKET"].includes(wicketType || "")) {
      return NextResponse.json({ error: "Invalid wicket type on a wide ball" }, { status: 400 });
    }
    if (isWicket && extraType === "NO_BALL" && wicketType !== "RUN_OUT") {
      return NextResponse.json({ error: "Only run out is allowed on a no-ball" }, { status: 400 });
    }

    const inningsMeta = await prisma.innings.findUnique({
      where: { id: inningsId },
      select: {
        teamId: true,
        match: {
          select: {
            id: true,
            status: true,
            homeTeamId: true,
            awayTeamId: true,
          },
        },
      },
    });
    if (!inningsMeta) return NextResponse.json({ error: "Innings not found" }, { status: 404 });
    if (inningsMeta.match.status === "COMPLETED") {
      return NextResponse.json({ error: "Match is already completed" }, { status: 409 });
    }
    const bowlingTeamId =
      inningsMeta.teamId === inningsMeta.match.homeTeamId
        ? inningsMeta.match.awayTeamId
        : inningsMeta.match.homeTeamId;

    if (batsmanId) {
      const batter = await prisma.player.findUnique({
        where: { id: batsmanId },
        select: { teamId: true },
      });
      if (!batter || batter.teamId !== inningsMeta.teamId) {
        return NextResponse.json({ error: "Invalid batsman for batting team" }, { status: 400 });
      }
    }
    if (bowlerId) {
      const bowler = await prisma.player.findUnique({
        where: { id: bowlerId },
        select: { teamId: true },
      });
      if (!bowler || bowler.teamId !== bowlingTeamId) {
        return NextResponse.json({ error: "Invalid bowler for bowling team" }, { status: 400 });
      }
    }

    const wicketCountsAgainstTeam = Boolean(isWicket && wicketType !== "RETIRED_HURT");
    const wicketCountsAgainstBowler = Boolean(
      wicketCountsAgainstTeam && !["RUN_OUT", "RETIRED_OUT"].includes(wicketType || "")
    );
    const batterIsOut = wicketCountsAgainstTeam;

    const over = await prisma.over.findUnique({
      where: { id: overId },
      select: { id: true, bowlerId: true, inningsId: true },
    });
    if (!over || over.inningsId !== inningsId) {
      return NextResponse.json({ error: "Invalid over for innings" }, { status: 400 });
    }
    if (over.bowlerId && bowlerId && over.bowlerId !== bowlerId) {
      return NextResponse.json(
        { error: "Ball bowler must match the selected over bowler" },
        { status: 400 }
      );
    }

    // Verify SCORER is assigned to this match
    if (session.user.role === "SCORER") {
      const innings = await prisma.innings.findUnique({ where: { id: inningsId }, select: { matchId: true } });
      if (!innings) return NextResponse.json({ error: "Innings not found" }, { status: 404 });
      const match = await prisma.match.findUnique({ where: { id: innings.matchId }, select: { scorerId: true } });
      if (match?.scorerId !== session.user.id) {
        return NextResponse.json({ error: "You are not the assigned scorer for this match" }, { status: 403 });
      }
    }

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
    if (wicketCountsAgainstTeam) inningsUpdate.totalWickets = { increment: 1 };

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
    if (wicketCountsAgainstTeam) overUpdate.wickets = { increment: 1 };

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
              isOut: batterIsOut,
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
            isOut: batterIsOut,
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
            wickets: wicketCountsAgainstBowler ? { increment: 1 } : undefined,
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
            wickets: wicketCountsAgainstBowler ? 1 : 0,
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

      // Ensure standings/stats are applied once even if duplicate completion requests race.
      const completionApplied = await prisma.match.updateMany({
        where: { id: match.id, status: { not: "COMPLETED" } },
        data: { status: "COMPLETED", result, winnerTeamId, winMargin, winType },
      });

      if (completionApplied.count > 0) {
        const completedMatch = await prisma.match.findUnique({
          where: { id: match.id },
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
        if (!completedMatch) {
          return NextResponse.json({ error: "Match not found after completion" }, { status: 404 });
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
        await updatePlayerStatsForMatchScopes(completedMatch.innings, match.leagueId);

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
