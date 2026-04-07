import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canScoreMatch } from "@/lib/permissions";
import { ROLE } from "@/lib/roles";
import { replayInningsState } from "@/lib/scoring-replay";

export const dynamic = 'force-dynamic';

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
    const updatedInnings = await replayInningsState(inningsId);

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        matchId: updatedInnings?.matchId || null,
        action: "BALL_EVENT_UNDO",
        entity: "BallEvent",
        entityId: lastBall.id,
        oldValue: JSON.stringify(lastBall),
      },
    });

    await prisma.ballEventAudit.create({
      data: {
        eventId: lastBall.id,
        inningsId,
        matchId: updatedInnings?.matchId || null,
        changedBy: session.user.id,
        action: "UNDO",
        oldValue: JSON.stringify(lastBall),
        revisionNo: lastBall.revisionNo || 1,
      },
    });

    return NextResponse.json({ message: "Ball event undone", innings: updatedInnings, deletedBall: lastBall });
  } catch (error) {
    console.error("Undo error:", error);
    return NextResponse.json({ error: "Failed to undo ball event" }, { status: 500 });
  }
}
