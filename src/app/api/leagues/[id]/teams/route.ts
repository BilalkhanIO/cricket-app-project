import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { teamId, action, approvalNotes, registrationFeeStatus } = await req.json();
    const league = await prisma.league.findUnique({
      where: { id },
      include: {
        _count: { select: { teams: true } },
      },
    });
    if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });

    if (action === "register") {
      const now = new Date();
      if (league.registrationOpenDate && now < league.registrationOpenDate) {
        return NextResponse.json({ error: "Registration has not opened yet" }, { status: 400 });
      }
      if (league.registrationCloseDate && now > league.registrationCloseDate) {
        return NextResponse.json({ error: "Registration is closed" }, { status: 400 });
      }
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
        const duplicatePlayer = await prisma.player.findFirst({
          where: {
            userId: { in: teamWithPlayers.players.map((p) => p.userId) },
            teamId: { not: teamId },
            team: {
              leagues: {
                some: {
                  leagueId: id,
                  status: { in: ["PENDING", "APPROVED", "WAITLISTED"] },
                },
              },
            },
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
          status: "PENDING",
          registrationFeeStatus: registrationFeeStatus || "PENDING",
        },
        create: {
          teamId,
          leagueId: id,
          status: "PENDING",
          registrationFeeStatus: registrationFeeStatus || "PENDING",
        },
      });
      return NextResponse.json({ registration });
    }

    if (action === "approve" || action === "reject" || action === "waitlist") {
      const canApprove = ["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(session.user.role);
      if (!canApprove) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const updated = await prisma.teamLeague.update({
        where: { teamId_leagueId: { teamId, leagueId: id } },
        data: {
          status:
            action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "WAITLISTED",
          approvalNotes: approvalNotes || null,
          ...(action === "approve" && { approvedAt: new Date() }),
          ...(action === "reject" && { rejectedAt: new Date() }),
          ...(action === "waitlist" && { waitlistedAt: new Date() }),
          ...(registrationFeeStatus && { registrationFeeStatus }),
        },
      });

      if (action === "approve") {
        await prisma.pointsTable.upsert({
          where: { leagueId_teamId: { leagueId: id, teamId } },
          update: {},
          create: { leagueId: id, teamId },
        });
      }

      return NextResponse.json({ updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
