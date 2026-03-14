import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const registrations = await prisma.playerLeagueRegistration.findMany({
      where: { leagueId: id },
      include: {
        player: {
          include: {
            user: { select: { id: true, name: true, email: true, profileImage: true } },
            team: { select: { id: true, name: true, shortName: true } },
          },
        },
        team: { select: { id: true, name: true, shortName: true, logo: true } },
      },
      orderBy: { registeredAt: "desc" },
    });

    return NextResponse.json({ registrations });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch league player registrations" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const canManage = ["SUPER_ADMIN", "LEAGUE_ADMIN", "TEAM_MANAGER", "PLAYER"].includes(
      session.user.role
    );
    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const playerId = body.playerId;
    const teamId = body.teamId || null;

    if (!playerId) {
      return NextResponse.json({ error: "playerId is required" }, { status: 400 });
    }

    const league = await prisma.league.findUnique({ where: { id } });
    if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { user: { select: { id: true } } },
    });
    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    if (session.user.role === "PLAYER" && player.user.id !== session.user.id) {
      return NextResponse.json(
        { error: "Players can only register their own profile" },
        { status: 403 }
      );
    }

    if (teamId) {
      const teamLeague = await prisma.teamLeague.findUnique({
        where: { teamId_leagueId: { teamId, leagueId: id } },
      });
      if (!teamLeague || teamLeague.status !== "APPROVED") {
        return NextResponse.json({ error: "Team is not approved in this league" }, { status: 400 });
      }

      const assignedCount = await prisma.playerLeagueRegistration.count({
        where: { leagueId: id, teamId, status: { in: ["PENDING", "APPROVED"] } },
      });
      if (assignedCount >= league.squadSizeLimit) {
        return NextResponse.json(
          { error: `Team squad limit reached for this league (${league.squadSizeLimit})` },
          { status: 400 }
        );
      }
    }

    const registration = await prisma.playerLeagueRegistration.upsert({
      where: { leagueId_playerId: { leagueId: id, playerId } },
      update: {
        teamId,
        notes: body.notes || null,
        status: body.status || "PENDING",
        ...(body.status === "APPROVED" && { approvedAt: new Date() }),
        ...(body.status === "REJECTED" && { rejectedAt: new Date() }),
        ...(body.status === "WAITLISTED" && { waitlistedAt: new Date() }),
      },
      create: {
        leagueId: id,
        playerId,
        teamId,
        notes: body.notes || null,
        status: body.status || "PENDING",
        ...(body.status === "APPROVED" && { approvedAt: new Date() }),
        ...(body.status === "REJECTED" && { rejectedAt: new Date() }),
        ...(body.status === "WAITLISTED" && { waitlistedAt: new Date() }),
      },
      include: {
        player: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        team: { select: { id: true, name: true, shortName: true } },
      },
    });

    // Optional: sync player's base team assignment when a team is chosen.
    if (teamId && player.teamId !== teamId) {
      await prisma.player.update({
        where: { id: playerId },
        data: { teamId },
      });
    }

    return NextResponse.json({ registration }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to register player in league" }, { status: 500 });
  }
}
