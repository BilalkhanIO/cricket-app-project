import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canScoreMatch } from "@/lib/permissions";
import { ROLE } from "@/lib/roles";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!canScoreMatch(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { inningsId, overNumber, bowlerId } = await req.json();
    if (!inningsId || !overNumber || !bowlerId) {
      return NextResponse.json(
        { error: "inningsId, overNumber and bowlerId are required" },
        { status: 400 }
      );
    }

    // Verify SCORER is assigned to this match
    if (session.user.role === ROLE.SCORER) {
      const innings = await prisma.innings.findUnique({ where: { id: inningsId }, select: { matchId: true } });
      if (!innings) return NextResponse.json({ error: "Innings not found" }, { status: 404 });
      const match = await prisma.match.findUnique({ where: { id: innings.matchId }, select: { scorerId: true } });
      if (match?.scorerId !== session.user.id) {
        return NextResponse.json({ error: "You are not the assigned scorer for this match" }, { status: 403 });
      }
    }

    const previousOver = await prisma.over.findFirst({
      where: { inningsId, overNumber: overNumber - 1 },
      include: {
        balls: {
          select: { isExtra: true, extraType: true },
        },
      },
    });
    if (overNumber > 1 && !previousOver) {
      return NextResponse.json({ error: "Previous over is missing" }, { status: 409 });
    }
    if (previousOver?.bowlerId && previousOver.bowlerId === bowlerId) {
      return NextResponse.json(
        { error: "Same bowler cannot bowl consecutive overs" },
        { status: 400 }
      );
    }
    if (previousOver) {
      const legalBalls = previousOver.balls.filter(
        (ball) => !ball.isExtra || ball.extraType === "BYE" || ball.extraType === "LEG_BYE"
      ).length;
      if (legalBalls < 6) {
        return NextResponse.json(
          { error: "Previous over is not complete yet" },
          { status: 409 }
        );
      }
    }

    // Mark previous over as completed after validating six legal balls.
    await prisma.over.updateMany({
      where: { inningsId, overNumber: overNumber - 1 },
      data: { isCompleted: true },
    });

    const existingOver = await prisma.over.findFirst({
      where: { inningsId, overNumber },
    });
    if (existingOver) {
      return NextResponse.json({ over: existingOver }, { status: 200 });
    }

    // Create new over
    const over = await prisma.over.create({
      data: { inningsId, overNumber, bowlerId },
    });

    return NextResponse.json({ over }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to start over" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!canScoreMatch(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { overId, bowlerId } = await req.json();
    if (!overId || !bowlerId) {
      return NextResponse.json({ error: "overId and bowlerId are required" }, { status: 400 });
    }

    const over = await prisma.over.findUnique({
      where: { id: overId },
      include: {
        balls: { select: { id: true } },
        innings: { select: { id: true, matchId: true } },
      },
    });

    if (!over) {
      return NextResponse.json({ error: "Over not found" }, { status: 404 });
    }

    if (session.user.role === ROLE.SCORER) {
      const match = await prisma.match.findUnique({
        where: { id: over.innings.matchId },
        select: { scorerId: true },
      });
      if (match?.scorerId !== session.user.id) {
        return NextResponse.json({ error: "You are not the assigned scorer for this match" }, { status: 403 });
      }
    }

    if (over.balls.length > 0) {
      return NextResponse.json(
        { error: "Bowler can only be changed before the first ball of the over" },
        { status: 400 }
      );
    }

    const previousOver = await prisma.over.findFirst({
      where: { inningsId: over.inningsId, overNumber: over.overNumber - 1 },
      select: { bowlerId: true },
    });
    if (previousOver?.bowlerId && previousOver.bowlerId === bowlerId) {
      return NextResponse.json(
        { error: "Same bowler cannot bowl consecutive overs" },
        { status: 400 }
      );
    }

    const updatedOver = await prisma.over.update({
      where: { id: over.id },
      data: { bowlerId },
    });

    return NextResponse.json({ over: updatedOver }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update over" }, { status: 500 });
  }
}
