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

    const { tossWinnerId, tossDecision } = await req.json();
    if (!tossWinnerId || !tossDecision) {
      return NextResponse.json({ error: "tossWinnerId and tossDecision are required" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id },
      select: {
        id: true,
        scorerId: true,
        homeTeamId: true,
        awayTeamId: true,
        status: true,
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
    if (![match.homeTeamId, match.awayTeamId].includes(tossWinnerId)) {
      return NextResponse.json({ error: "Invalid toss winner" }, { status: 400 });
    }
    if (!["bat", "bowl"].includes(String(tossDecision).toLowerCase())) {
      return NextResponse.json({ error: "Invalid toss decision" }, { status: 400 });
    }

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        tossWinnerId,
        tossDecision: String(tossDecision).toLowerCase(),
        status: "TOSS",
      },
    });

    return NextResponse.json({ match: updatedMatch });
  } catch (error) {
    return NextResponse.json({ error: "Failed to record toss" }, { status: 500 });
  }
}
