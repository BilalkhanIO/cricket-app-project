import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canScore = ["SUPER_ADMIN", "LEAGUE_ADMIN", "SCORER"].includes(session.user.role);
    if (!canScore) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { inningsId } = await req.json();

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

    // Recalculate innings totals from remaining ball events
    const remainingBalls = await prisma.ballEvent.findMany({
      where: { inningsId },
    });

    const totalRuns = remainingBalls.reduce((sum, b) => sum + b.runs + b.extraRuns, 0);
    const totalWickets = remainingBalls.filter((b) => b.isWicket).length;
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
      const overWickets = over.balls.filter((b) => b.isWicket).length;
      const overLegalBalls = over.balls.filter(
        (b) => !b.isExtra || b.extraType === "BYE" || b.extraType === "LEG_BYE"
      ).length;

      await prisma.over.update({
        where: { id: lastBall.overId },
        data: {
          runs: overRuns,
          wickets: overWickets,
          isCompleted: overLegalBalls >= 6,
        },
      });
    }

    // Recalculate batting scorecard for the batsman
    if (lastBall.batsmanId) {
      const batsmanBalls = remainingBalls.filter((b) => b.batsmanId === lastBall.batsmanId);
      const batRuns = batsmanBalls
        .filter((b) => !b.isExtra || b.extraType === "NO_BALL")
        .reduce((s, b) => s + b.runs, 0);
      const batBalls = batsmanBalls.filter(
        (b) => !b.isExtra || b.extraType === "NO_BALL"
      ).length;
      const batFours = batsmanBalls.filter((b) => b.isBoundary && !b.isSix).length;
      const batSixes = batsmanBalls.filter((b) => b.isSix).length;
      const isOut = batsmanBalls.some((b) => b.isWicket);

      const existingBatting = await prisma.battingScorecard.findFirst({
        where: { inningsId, playerId: lastBall.batsmanId },
      });

      if (existingBatting) {
        await prisma.battingScorecard.update({
          where: { id: existingBatting.id },
          data: { runs: batRuns, balls: batBalls, fours: batFours, sixes: batSixes, isOut },
        });
      }
    }

    // Recalculate bowling scorecard for the bowler
    if (lastBall.bowlerId) {
      const bowlerBalls = remainingBalls.filter((b) => b.bowlerId === lastBall.bowlerId);
      const bowlRuns = bowlerBalls.reduce((s, b) => s + b.runs + b.extraRuns, 0);
      const bowlWickets = bowlerBalls.filter((b) => b.isWicket).length;
      const bowlWides = bowlerBalls.filter((b) => b.extraType === "WIDE").length;
      const bowlNoBalls = bowlerBalls.filter((b) => b.extraType === "NO_BALL").length;

      const existingBowling = await prisma.bowlingScorecard.findFirst({
        where: { inningsId, playerId: lastBall.bowlerId },
      });

      if (existingBowling) {
        await prisma.bowlingScorecard.update({
          where: { id: existingBowling.id },
          data: { runs: bowlRuns, wickets: bowlWickets, wides: bowlWides, noBalls: bowlNoBalls },
        });
      }
    }

    return NextResponse.json({ message: "Ball event undone", innings: updatedInnings, deletedBall: lastBall });
  } catch (error) {
    console.error("Undo error:", error);
    return NextResponse.json({ error: "Failed to undo ball event" }, { status: 500 });
  }
}
