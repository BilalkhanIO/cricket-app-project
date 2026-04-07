import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canManageTeamRegistrations } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { teamId, action, approvalNotes, group } = await req.json();
    const league = await prisma.league.findUnique({
      where: { id },
      include: {
        _count: { select: { teams: true } },
      },
    });
    if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });

    if (!canManageTeamRegistrations(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "register" || action === "add" || !action) {
      if (league._count.teams >= league.maxTeams) {
        return NextResponse.json({ error: "League team limit reached" }, { status: 400 });
      }

      const teamWithPlayers = await prisma.team.findUnique({
        where: { id: teamId },
        include: { players: { select: { userId: true } } },
      });
      if (!teamWithPlayers) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }
      if (teamWithPlayers.players.length > league.squadSizeLimit) {
        return NextResponse.json(
          { error: `Squad size exceeds league limit (${league.squadSizeLimit})` },
          { status: 400 }
        );
      }

      if (!league.allowMultiTeamPlayers && teamWithPlayers.players.length > 0) {
        const duplicatePlayer = await prisma.playerLeagueRegistration.findFirst({
          where: {
            leagueId: id,
            player: {
              userId: { in: teamWithPlayers.players.map((p) => p.userId) },
            },
            teamId: { not: null },
            status: { in: ["PENDING", "APPROVED", "WAITLISTED"] },
            NOT: { teamId },
          },
          select: { id: true },
        });

        if (duplicatePlayer) {
          return NextResponse.json(
            { error: "One or more players are already registered in another team for this league" },
            { status: 400 }
          );
        }
      }

      const registration = await prisma.teamLeague.upsert({
        where: { teamId_leagueId: { teamId, leagueId: id } },
        update: {
          status: "ACTIVE",
          group: group || null,
          approvalNotes: approvalNotes || null,
          approvedAt: new Date(),
        },
        create: {
          teamId,
          leagueId: id,
          status: "ACTIVE",
          group: group || null,
          approvalNotes: approvalNotes || null,
          approvedAt: new Date(),
        },
      });

      await prisma.pointsTable.upsert({
        where: { leagueId_teamId: { leagueId: id, teamId } },
        update: { group: group || null },
        create: { leagueId: id, teamId, group: group || null },
      });

      return NextResponse.json({ registration });
    }

    if (action === "update-group") {
      const registration = await prisma.teamLeague.update({
        where: { teamId_leagueId: { teamId, leagueId: id } },
        data: { group: group || null },
      });

      await prisma.pointsTable.upsert({
        where: { leagueId_teamId: { leagueId: id, teamId } },
        update: { group: group || null },
        create: { leagueId: id, teamId, group: group || null },
      });

      return NextResponse.json({ registration });
    }

    if (action === "remove") {
      await prisma.teamLeague.delete({
        where: { teamId_leagueId: { teamId, leagueId: id } },
      });

      return NextResponse.json({ removed: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
