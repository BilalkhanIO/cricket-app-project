import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = ["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(session.user.role);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { scorerId } = await req.json();

    const match = await prisma.match.findUnique({
      where: { id },
      select: {
        id: true,
        scorerId: true,
        homeTeam: { select: { shortName: true } },
        awayTeam: { select: { shortName: true } },
        matchDate: true,
      },
    });

    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    let scorer: { id: string; role: string; name: string } | null = null;
    if (scorerId) {
      scorer = await prisma.user.findUnique({
        where: { id: scorerId },
        select: { id: true, role: true, name: true },
      });

      if (!scorer) return NextResponse.json({ error: "Scorer user not found" }, { status: 404 });

      const allowedRoles = ["SCORER", "LEAGUE_ADMIN", "SUPER_ADMIN"];
      if (!allowedRoles.includes(scorer.role)) {
        return NextResponse.json({ error: "User does not have scorer permissions" }, { status: 400 });
      }
    }

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: { scorerId: scorerId || null },
      select: {
        id: true,
        scorerId: true,
        status: true,
      },
    });

    if (scorerId && scorerId !== match.scorerId) {
      await prisma.notification.create({
        data: {
          userId: scorerId,
          matchId: id,
          type: "MATCH_REMINDER",
          title: "You have been assigned as scorer",
          message: `You are the scorer for ${match.homeTeam.shortName} vs ${match.awayTeam.shortName} on ${match.matchDate.toLocaleDateString("en-GB")}.`,
        },
      }).catch(() => {});
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        matchId: id,
        action: "ASSIGN_SCORER",
        entity: "Match",
        entityId: id,
        newValue: JSON.stringify({ scorerId: scorerId || null }),
      },
    });

    return NextResponse.json({ match: updatedMatch, scorer });
  } catch (error) {
    return NextResponse.json({ error: "Failed to assign scorer" }, { status: 500 });
  }
}
