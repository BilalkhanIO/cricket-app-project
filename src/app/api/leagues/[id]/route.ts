import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";
import { canEditLeague } from "@/lib/permissions";
import { ROLE } from "@/lib/roles";

export const dynamic = 'force-dynamic';

export function OPTIONS(req: NextRequest) {
  return optionsWithCors(req);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const league = await prisma.league.findUnique({
      where: { id },
      include: {
        parentLeague: { select: { id: true, name: true, season: true, year: true } },
        seasons: {
          select: { id: true, name: true, season: true, year: true, status: true },
          orderBy: [{ year: "desc" }, { createdAt: "desc" }],
        },
        admin: { select: { id: true, name: true, email: true } },
        teams: {
          include: {
            team: {
              include: {
                manager: { select: { name: true } },
                _count: { select: { players: true } },
              },
            },
          },
        },
        matches: {
          include: {
            homeTeam: { select: { id: true, name: true, shortName: true, logo: true } },
            awayTeam: { select: { id: true, name: true, shortName: true, logo: true } },
            venue: { select: { name: true, city: true } },
          },
          orderBy: { matchDate: "asc" },
        },
        pointsTable: {
          include: { team: { select: { id: true, name: true, shortName: true, logo: true } } },
          orderBy: [{ points: "desc" }, { netRunRate: "desc" }],
        },
        announcements: {
          where: { isPublic: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        sponsors: true,
        playerRegistrations: {
          include: {
            player: {
              include: {
                user: { select: { id: true, name: true, email: true, profileImage: true } },
                team: { select: { id: true, name: true, shortName: true, logo: true } },
              },
            },
            team: { select: { id: true, name: true, shortName: true, logo: true } },
          },
          orderBy: { registeredAt: "desc" },
        },
      },
    });

    if (!league) return jsonWithCors(req, { error: "League not found" }, { status: 404 });
    return jsonWithCors(req, { league });
  } catch (error) {
    return jsonWithCors(req, { error: "Failed to fetch league" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const league = await prisma.league.findUnique({ where: { id } });
    if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const canEdit =
      canEditLeague(session.user.role) &&
      (session.user.role === ROLE.SUPER_ADMIN ||
        session.user.role === ROLE.LEAGUE_STAFF ||
        (session.user.role === ROLE.LEAGUE_ADMIN && league.adminId === session.user.id));
    if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const nextStartDate = data.startDate ? new Date(data.startDate) : league.startDate;
    const nextEndDate = data.endDate ? new Date(data.endDate) : league.endDate;
    const nextOvers = Number(data.oversPerInnings ?? league.oversPerInnings);
    const nextPowerplay = Number(data.powerplayOvers ?? league.powerplayOvers);
    const nextPlayerRegistrationStatus =
      data.playerRegistrationStatus ?? league.playerRegistrationStatus;

    if (Number.isNaN(nextStartDate.getTime()) || Number.isNaN(nextEndDate.getTime())) {
      return NextResponse.json({ error: "Invalid start/end date" }, { status: 400 });
    }
    if (nextStartDate >= nextEndDate) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }
    if (nextOvers <= 0 || nextPowerplay < 0 || nextPowerplay > nextOvers) {
      return NextResponse.json({ error: "Invalid overs configuration" }, { status: 400 });
    }

    const nextRegistrationOpen =
      "registrationOpenDate" in data
        ? data.registrationOpenDate
          ? new Date(data.registrationOpenDate)
          : null
        : league.registrationOpenDate;
    const nextRegistrationClose =
      "registrationCloseDate" in data
        ? data.registrationCloseDate
          ? new Date(data.registrationCloseDate)
          : null
        : league.registrationCloseDate;

    if (
      nextRegistrationOpen &&
      nextRegistrationClose &&
      nextRegistrationOpen > nextRegistrationClose
    ) {
      return NextResponse.json(
        { error: "Registration close date must be after open date" },
        { status: 400 }
      );
    }
    if (nextRegistrationClose && nextRegistrationClose > nextStartDate) {
      return NextResponse.json(
        { error: "Registration close date must be before league start date" },
        { status: 400 }
      );
    }
    if (!["OPEN", "CLOSED"].includes(nextPlayerRegistrationStatus)) {
      return NextResponse.json(
        { error: "Invalid player registration status" },
        { status: 400 }
      );
    }

    let nextParentLeagueId = league.parentLeagueId;
    if ("parentLeagueId" in data) {
      nextParentLeagueId = data.parentLeagueId || null;
      if (nextParentLeagueId === id) {
        return NextResponse.json(
          { error: "A league season cannot be its own parent" },
          { status: 400 }
        );
      }
      if (nextParentLeagueId) {
        const parentLeague = await prisma.league.findUnique({
          where: { id: nextParentLeagueId },
          select: { id: true },
        });
        if (!parentLeague) {
          return NextResponse.json({ error: "Parent league not found" }, { status: 404 });
        }
      }
    }

    const updated = await prisma.league.update({
      where: { id },
      data: {
        ...data,
        parentLeagueId: nextParentLeagueId,
        playerRegistrationStatus: nextPlayerRegistrationStatus,
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...("registrationOpenDate" in data && { registrationOpenDate: nextRegistrationOpen }),
        ...("registrationCloseDate" in data && { registrationCloseDate: nextRegistrationClose }),
      },
    });

    return NextResponse.json({ league: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update league" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.league.update({
      where: { id },
      data: { status: "CANCELED" },
    });

    return NextResponse.json({ message: "League canceled" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete league" }, { status: 500 });
  }
}
