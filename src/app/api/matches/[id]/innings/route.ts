import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canScoreMatch } from "@/lib/permissions";
import { ROLE, isAdminRole } from "@/lib/roles";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { teamId, inningsNumber, targetRuns } = await req.json();
    if (!teamId || !inningsNumber) {
      return NextResponse.json({ error: "teamId and inningsNumber are required" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id },
      select: {
        id: true,
        scorerId: true,
        status: true,
        homeTeamId: true,
        awayTeamId: true,
        innings: {
          select: { id: true, inningsNumber: true, isCompleted: true },
          orderBy: { inningsNumber: "asc" },
        },
      },
    });
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    const isAdmin = isAdminRole(session.user.role) || session.user.role === ROLE.LEAGUE_STAFF;
    const isAssignedScorer = session.user.role === ROLE.SCORER && match.scorerId === session.user.id;
    if (!canScoreMatch(session.user.role) && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!isAdmin && !isAssignedScorer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (![match.homeTeamId, match.awayTeamId].includes(teamId)) {
      return NextResponse.json({ error: "Selected team is not part of this match" }, { status: 400 });
    }
    if (match.status === "COMPLETED") {
      return NextResponse.json({ error: "Match is already completed" }, { status: 409 });
    }
    if (match.innings.some((inning) => inning.inningsNumber === inningsNumber)) {
      return NextResponse.json({ error: `Innings ${inningsNumber} already exists` }, { status: 409 });
    }
    if (inningsNumber > 1 && !match.innings.some((inning) => inning.inningsNumber === inningsNumber - 1 && inning.isCompleted)) {
      return NextResponse.json({ error: "Previous innings must be completed first" }, { status: 400 });
    }

    const innings = await prisma.innings.create({
      data: {
        matchId: id,
        teamId,
        inningsNumber,
        targetRuns: targetRuns || null,
      },
    });

    // Update match status to LIVE
    await prisma.match.update({
      where: { id },
      data: { status: "LIVE" },
    });

    return NextResponse.json({ innings }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to start innings" }, { status: 500 });
  }
}
