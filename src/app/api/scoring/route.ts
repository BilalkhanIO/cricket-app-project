import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    // Update innings totals
    const inningsUpdate: any = {
      totalRuns: { increment: totalRuns },
      extras: { increment: extraRuns || 0 },
    };

    if (!isExtra || extraType === "BYE" || extraType === "LEG_BYE") {
      inningsUpdate.totalBalls = { increment: 1 };
    }

    if (isWicket) {
      inningsUpdate.totalWickets = { increment: 1 };
    }

    if (extraType === "WIDE") inningsUpdate.wides = { increment: (extraRuns || 0) + 1 };
    if (extraType === "NO_BALL") inningsUpdate.noBalls = { increment: 1 };
    if (extraType === "BYE") inningsUpdate.byes = { increment: extraRuns || 0 };
    if (extraType === "LEG_BYE") inningsUpdate.legByes = { increment: extraRuns || 0 };

    const innings = await prisma.innings.update({
      where: { id: inningsId },
      data: inningsUpdate,
    });

    // Update over stats
    const overUpdate: any = {
      runs: { increment: totalRuns },
    };
    if (isWicket) overUpdate.wickets = { increment: 1 };

    await prisma.over.update({
      where: { id: overId },
      data: overUpdate,
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

      const legalBall = !isExtra || extraType === "BYE" || extraType === "LEG_BYE";

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

    return NextResponse.json({ ball, innings });
  } catch (error) {
    console.error("Scoring error:", error);
    return NextResponse.json({ error: "Failed to record ball event" }, { status: 500 });
  }
}
