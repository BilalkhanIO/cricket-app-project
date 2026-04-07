import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canScoreMatch } from "@/lib/permissions";
import { ROLE, isAdminRole, normalizeRole } from "@/lib/roles";

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
      include: {
        homeTeam: { select: { name: true, shortName: true, managerId: true } },
        awayTeam: { select: { name: true, shortName: true, managerId: true } },
      },
    });
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    const effectiveRole = normalizeRole(session.user.role);
    const isAdmin = isAdminRole(session.user.role);
    const isAssignedScorer = effectiveRole === ROLE.SCORER && match.scorerId === session.user.id;
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

    // Notify team managers of toss result
    const tossWinnerName = tossWinnerId === match.homeTeamId ? match.homeTeam.shortName : match.awayTeam.shortName;
    const managerIds = [match.homeTeam.managerId, match.awayTeam.managerId].filter(Boolean) as string[];
    if (managerIds.length > 0) {
      await prisma.notification.createMany({
        data: managerIds.map((uid) => ({
          userId: uid,
          matchId: id,
          type: "TOSS_UPDATE",
          title: "Toss completed",
          message: `${tossWinnerName} won the toss and chose to ${String(tossDecision).toLowerCase()}.`,
        })),
        skipDuplicates: true,
      }).catch(() => {});
    }

    return NextResponse.json({ match: updatedMatch });
  } catch (error) {
    return NextResponse.json({ error: "Failed to record toss" }, { status: 500 });
  }
}
