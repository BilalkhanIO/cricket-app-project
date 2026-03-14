import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id, playerId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canManage = ["SUPER_ADMIN", "LEAGUE_ADMIN", "TEAM_MANAGER"].includes(session.user.role);
    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const teamId = body.teamId;
    const status = body.status || "APPROVED";

    if (!teamId) return NextResponse.json({ error: "teamId is required" }, { status: 400 });

    const league = await prisma.league.findUnique({ where: { id } });
    if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });

    const registration = await prisma.playerLeagueRegistration.findUnique({
      where: { leagueId_playerId: { leagueId: id, playerId } },
    });
    if (!registration) {
      return NextResponse.json({ error: "Player is not registered in this league" }, { status: 404 });
    }

    const teamLeague = await prisma.teamLeague.findUnique({
      where: { teamId_leagueId: { teamId, leagueId: id } },
    });
    if (!teamLeague || teamLeague.status !== "APPROVED") {
      return NextResponse.json({ error: "Target team is not approved in this league" }, { status: 400 });
    }

    const assignedCount = await prisma.playerLeagueRegistration.count({
      where: {
        leagueId: id,
        teamId,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });

    if (registration.teamId !== teamId && assignedCount >= league.squadSizeLimit) {
      return NextResponse.json(
        { error: `Team squad limit reached for this league (${league.squadSizeLimit})` },
        { status: 400 }
      );
    }

    const updated = await prisma.playerLeagueRegistration.update({
      where: { leagueId_playerId: { leagueId: id, playerId } },
      data: {
        teamId,
        status,
        ...(status === "APPROVED" && { approvedAt: new Date() }),
        ...(status === "REJECTED" && { rejectedAt: new Date() }),
        ...(status === "WAITLISTED" && { waitlistedAt: new Date() }),
      },
      include: {
        player: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        team: { select: { id: true, name: true, shortName: true } },
      },
    });

    // Keep the main Player.teamId aligned for squad and playing-XI flows.
    await prisma.player.update({ where: { id: playerId }, data: { teamId } });

    return NextResponse.json({ registration: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to assign player to team" }, { status: 500 });
  }
}
