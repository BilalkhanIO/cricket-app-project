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

    const { inningsId, overNumber, bowlerId } = await req.json();
    if (!inningsId || !overNumber || !bowlerId) {
      return NextResponse.json(
        { error: "inningsId, overNumber and bowlerId are required" },
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

    const previousOver = await prisma.over.findFirst({
      where: { inningsId, overNumber: overNumber - 1 },
      select: { bowlerId: true },
    });
    if (previousOver?.bowlerId && previousOver.bowlerId === bowlerId) {
      return NextResponse.json(
        { error: "Same bowler cannot bowl consecutive overs" },
        { status: 400 }
      );
    }

    // Mark previous over as completed
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
