import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canScoreMatch } from "@/lib/permissions";
import { ROLE } from "@/lib/roles";

export const dynamic = 'force-dynamic';

function parseBallMeta(commentary: string | null | undefined) {
  if (!commentary?.startsWith("__meta__")) return null;

  try {
    return JSON.parse(commentary.slice("__meta__".length)) as {
      dismissedBatsmanId?: string | null;
      dismissedBatsmanOrder?: number | null;
      text?: string | null;
    };
  } catch {
    return null;
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!canScoreMatch(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { inningsId } = await req.json();

    // Verify SCORER is assigned to this match
    if (session.user.role === ROLE.SCORER) {
      const innings = await prisma.innings.findUnique({ where: { id: inningsId }, select: { matchId: true } });
      if (!innings) return NextResponse.json({ error: "Innings not found" }, { status: 404 });
      const match = await prisma.match.findUnique({ where: { id: innings.matchId }, select: { scorerId: true } });
      if (match?.scorerId !== session.user.id) {
        return NextResponse.json({ error: "You are not the assigned scorer for this match" }, { status: 403 });
      }
    }

    // Find the last ball event for this innings
    const lastBall = await prisma.ballEvent.findFirst({
      where: { inningsId },
      orderBy: { createdAt: "desc" },
    });

    if (!lastBall) {
      return NextResponse.json({ error: "No ball events to undo" }, { status: 404 });
    }

    // Delete the ball event
    await prisma.ballEvent.delete({ where: { id: lastBall.id } });
    const lastBallMeta = parseBallMeta(lastBall.commentary);
    const dismissedPlayerId = lastBallMeta?.dismissedBatsmanId || lastBall.batsmanId;

    // Recalculate innings totals from remaining ball events
    const remainingBalls = await prisma.ballEvent.findMany({
      where: { inningsId },
    });

    const totalRuns = remainingBalls.reduce((sum, b) => sum + b.runs + b.extraRuns, 0);
    const totalWickets = remainingBalls.filter((b) => b.isWicket && b.wicketType !== "RETIRED_HURT").length;
    const totalBalls = remainingBalls.filter(
      (b) => !b.isExtra || b.extraType === "BYE" || b.extraType === "LEG_BYE"
    ).length;
    const wides = remainingBalls.filter((b) => b.extraType === "WIDE").reduce((s, b) => s + b.extraRuns, 0);
    const noBalls = remainingBalls.filter((b) => b.extraType === "NO_BALL").length;
    const byes = remainingBalls.filter((b) => b.extraType === "BYE").reduce((s, b) => s + b.extraRuns, 0);
    const legByes = remainingBalls.filter((b) => b.extraType === "LEG_BYE").reduce((s, b) => s + b.extraRuns, 0);
    const extras = wides + noBalls + byes + legByes;
    const totalOvers = Math.floor(totalBalls / 6) + (totalBalls % 6) / 10;

    const updatedInnings = await prisma.innings.update({
      where: { id: inningsId },
      data: {
        totalRuns,
        totalWickets,
        totalBalls,
        totalOvers,
        extras,
        wides,
        noBalls,
        byes,
        legByes,
      },
    });

    // Recalculate the over stats for the over that contained the undone ball
    const over = await prisma.over.findUnique({ where: { id: lastBall.overId }, include: { balls: true } });
    if (over) {
      const overRuns = over.balls.reduce((s, b) => s + b.runs + b.extraRuns, 0);
      const overWickets = over.balls.filter((b) => b.isWicket && b.wicketType !== "RETIRED_HURT").length;
      const overLegalBalls = over.balls.filter(
        (b) => !b.isExtra || b.extraType === "BYE" || b.extraType === "LEG_BYE"
      ).length;
      const overBowlerRuns = over.balls.reduce((sum, b) => {
        if (b.extraType === "BYE" || b.extraType === "LEG_BYE") return sum;
        return sum + b.runs + b.extraRuns;
      }, 0);

      await prisma.over.update({
        where: { id: lastBall.overId },
        data: {
          runs: overRuns,
          wickets: overWickets,
          isCompleted: overLegalBalls >= 6,
          isMaiden: overLegalBalls >= 6 && overBowlerRuns === 0,
        },
      });
    }

    const syncBattingScorecard = async (playerId: string | null | undefined) => {
      if (!playerId) return;

      const playerBalls = remainingBalls.filter((ball) => ball.batsmanId === playerId);
      const batRuns = playerBalls
        .filter((ball) => !ball.isExtra || ball.extraType === "NO_BALL")
        .reduce((sum, ball) => sum + ball.runs, 0);
      const batBalls = playerBalls.filter(
        (ball) => !ball.isExtra || ball.extraType === "NO_BALL"
      ).length;
      const batFours = playerBalls.filter((ball) => ball.isBoundary && !ball.isSix).length;
      const batSixes = playerBalls.filter((ball) => ball.isSix).length;
      const dismissalBall = [...remainingBalls].reverse().find((ball) => {
        const ballMeta = parseBallMeta(ball.commentary);
        const ballDismissedPlayerId = ballMeta?.dismissedBatsmanId || ball.batsmanId;
        return ballDismissedPlayerId === playerId && ball.isWicket && ball.wicketType !== "RETIRED_HURT";
      });
      const isOut = Boolean(dismissalBall);
      const strikeRate = batBalls > 0 ? Number((((batRuns * 100) / batBalls)).toFixed(2)) : 0;

      const existingBatting = await prisma.battingScorecard.findFirst({
        where: { inningsId, playerId },
      });

      if (existingBatting) {
        await prisma.battingScorecard.update({
          where: { id: existingBatting.id },
          data: {
            runs: batRuns,
            balls: batBalls,
            strikeRate,
            fours: batFours,
            sixes: batSixes,
            isOut,
            wicketType: dismissalBall?.wicketType || null,
            bowlerId: dismissalBall?.bowlerId || null,
            fielderId: dismissalBall?.fielderIds || null,
          },
        });
      }
    };

    await syncBattingScorecard(lastBall.batsmanId);
    if (dismissedPlayerId !== lastBall.batsmanId) {
      await syncBattingScorecard(dismissedPlayerId);
    }

    // Recalculate bowling scorecard for the bowler
    if (lastBall.bowlerId) {
      const bowlerBalls = remainingBalls.filter((b) => b.bowlerId === lastBall.bowlerId);
      const bowlRuns = bowlerBalls.reduce((s, b) => s + b.runs + b.extraRuns, 0);
      const bowlWickets = bowlerBalls.filter(
        (b) => b.isWicket && !["RUN_OUT", "RETIRED_OUT", "RETIRED_HURT"].includes(b.wicketType || "")
      ).length;
      const bowlWides = bowlerBalls.filter((b) => b.extraType === "WIDE").length;
      const bowlNoBalls = bowlerBalls.filter((b) => b.extraType === "NO_BALL").length;
      const legalBowled = bowlerBalls.filter(
        (b) => !b.isExtra || b.extraType === "BYE" || b.extraType === "LEG_BYE"
      ).length;
      const bowlOvers = Math.floor(legalBowled / 6) + (legalBowled % 6) / 10;
      const bowlEconomy = legalBowled > 0 ? Number((((bowlRuns * 6) / legalBowled)).toFixed(2)) : 0;
      const bowlerOvers = await prisma.over.findMany({
        where: { inningsId, bowlerId: lastBall.bowlerId },
        include: { balls: true },
      });
      const maidens = bowlerOvers.filter((currentOver) => {
        const legalBalls = currentOver.balls.filter(
          (b) => !b.isExtra || b.extraType === "BYE" || b.extraType === "LEG_BYE"
        ).length;
        const bowlerRunsConceded = currentOver.balls.reduce((sum, b) => {
          if (b.extraType === "BYE" || b.extraType === "LEG_BYE") return sum;
          return sum + b.runs + b.extraRuns;
        }, 0);

        return legalBalls >= 6 && bowlerRunsConceded === 0;
      }).length;

      const existingBowling = await prisma.bowlingScorecard.findFirst({
        where: { inningsId, playerId: lastBall.bowlerId },
      });

      if (existingBowling) {
        await prisma.bowlingScorecard.update({
          where: { id: existingBowling.id },
          data: {
            overs: bowlOvers,
            maidens,
            runs: bowlRuns,
            wickets: bowlWickets,
            economy: bowlEconomy,
            wides: bowlWides,
            noBalls: bowlNoBalls,
          },
        });
      }
    }

    return NextResponse.json({ message: "Ball event undone", innings: updatedInnings, deletedBall: lastBall });
  } catch (error) {
    console.error("Undo error:", error);
    return NextResponse.json({ error: "Failed to undo ball event" }, { status: 500 });
  }
}
