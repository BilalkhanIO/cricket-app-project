import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canManageLeaguePlayers } from "@/lib/permissions";
import { isAdminRole, ROLE } from "@/lib/roles";

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
    const canManage =
      canManageLeaguePlayers(session.user.role) || session.user.role === ROLE.PLAYER;
    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const canBypassRegistrationWindow = isAdminRole(session.user.role) || session.user.role === ROLE.LEAGUE_STAFF;

    const body = await req.json();
    const playerId = body.playerId;
    const teamId = body.teamId || null;

    if (!playerId) {
      return NextResponse.json({ error: "playerId is required" }, { status: 400 });
    }

    const league = await prisma.league.findUnique({ where: { id } });
    if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });
    if (!canBypassRegistrationWindow) {
      const now = new Date();
      if (league.playerRegistrationStatus !== "OPEN") {
        return NextResponse.json(
          { error: "Player registration is currently closed for this league season" },
          { status: 400 }
        );
      }
      if (league.registrationOpenDate && now < league.registrationOpenDate) {
        return NextResponse.json(
          { error: "Player registration has not opened yet for this league season" },
          { status: 400 }
        );
      }
      if (league.registrationCloseDate && now > league.registrationCloseDate) {
        return NextResponse.json(
          { error: "Player registration is closed for this league season" },
          { status: 400 }
        );
      }
    }

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
    if (session.user.role === "PLAYER" && body.status && body.status !== "PENDING") {
      return NextResponse.json(
        { error: "Players cannot set their own approval status" },
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

    const nextStatus = canBypassRegistrationWindow ? body.status || "PENDING" : "PENDING";

    const registration = await prisma.playerLeagueRegistration.upsert({
      where: { leagueId_playerId: { leagueId: id, playerId } },
      update: {
        teamId,
        notes: body.notes || null,
        status: nextStatus,
        approvedAt: nextStatus === "APPROVED" ? new Date() : null,
        rejectedAt: nextStatus === "REJECTED" ? new Date() : null,
        waitlistedAt: nextStatus === "WAITLISTED" ? new Date() : null,
      },
      create: {
        leagueId: id,
        playerId,
        teamId,
        notes: body.notes || null,
        status: nextStatus,
        approvedAt: nextStatus === "APPROVED" ? new Date() : null,
        rejectedAt: nextStatus === "REJECTED" ? new Date() : null,
        waitlistedAt: nextStatus === "WAITLISTED" ? new Date() : null,
      },
      include: {
        player: {
          include: {
            user: { select: { id: true, name: true, email: true, profileImage: true } },
            team: { select: { id: true, name: true, shortName: true } },
          },
        },
        team: { select: { id: true, name: true, shortName: true } },
      },
    });

    return NextResponse.json({ registration }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to register player in league" }, { status: 500 });
  }
}
