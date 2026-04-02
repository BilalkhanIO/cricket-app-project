import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";
import { canCreateLeague } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

export function OPTIONS(req: NextRequest) {
  return optionsWithCors(req);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const leagues = await prisma.league.findMany({
      where: {
        ...(status && { status }),
        ...(search && { name: { contains: search } }),
      },
      include: {
        admin: { select: { name: true, email: true } },
        _count: { select: { teams: true, matches: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonWithCors(req, { leagues });
  } catch (error) {
    return jsonWithCors(req, { error: "Failed to fetch leagues" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!canCreateLeague(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const parentLeagueId = data.parentLeagueId || null;
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const oversPerInnings = Number(data.oversPerInnings ?? 20);
    const powerplayOvers = Number(data.powerplayOvers ?? 6);
    const playerRegistrationStatus = data.playerRegistrationStatus || "CLOSED";

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid start/end date" }, { status: 400 });
    }
    if (startDate >= endDate) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }
    if (oversPerInnings <= 0 || powerplayOvers < 0 || powerplayOvers > oversPerInnings) {
      return NextResponse.json({ error: "Invalid overs configuration" }, { status: 400 });
    }

    let registrationOpenDate: Date | undefined;
    let registrationCloseDate: Date | undefined;
    if (data.registrationOpenDate) registrationOpenDate = new Date(data.registrationOpenDate);
    if (data.registrationCloseDate) registrationCloseDate = new Date(data.registrationCloseDate);
    if (registrationOpenDate && registrationCloseDate && registrationOpenDate > registrationCloseDate) {
      return NextResponse.json({ error: "Registration close date must be after open date" }, { status: 400 });
    }
    if (registrationCloseDate && registrationCloseDate > startDate) {
      return NextResponse.json({ error: "Registration close date must be before league start date" }, { status: 400 });
    }
    if (!["OPEN", "CLOSED"].includes(playerRegistrationStatus)) {
      return NextResponse.json({ error: "Invalid player registration status" }, { status: 400 });
    }
    if (parentLeagueId) {
      const parentLeague = await prisma.league.findUnique({
        where: { id: parentLeagueId },
        select: { id: true },
      });
      if (!parentLeague) {
        return NextResponse.json({ error: "Parent league not found" }, { status: 404 });
      }
    }

    const {
      startDate: _startDate,
      endDate: _endDate,
      registrationOpenDate: _registrationOpenDate,
      registrationCloseDate: _registrationCloseDate,
      parentLeagueId: _parentLeagueId,
      playerRegistrationStatus: _playerRegistrationStatus,
      ...rest
    } = data;

    const league = await prisma.league.create({
      data: {
        ...rest,
        adminId: session.user.id,
        parentLeagueId,
        playerRegistrationStatus,
        startDate,
        endDate,
        registrationOpenDate: registrationOpenDate || null,
        registrationCloseDate: registrationCloseDate || null,
      },
    });

    return NextResponse.json({ league }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create league" }, { status: 500 });
  }
}
