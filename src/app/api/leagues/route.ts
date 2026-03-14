import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

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

    return NextResponse.json({ leagues });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leagues" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canCreate = ["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(session.user.role);
    if (!canCreate) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const oversPerInnings = Number(data.oversPerInnings ?? 20);
    const powerplayOvers = Number(data.powerplayOvers ?? 6);

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

    const league = await prisma.league.create({
      data: {
        ...data,
        adminId: session.user.id,
        startDate,
        endDate,
        ...(registrationOpenDate && { registrationOpenDate }),
        ...(registrationCloseDate && { registrationCloseDate }),
      },
    });

    return NextResponse.json({ league }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create league" }, { status: 500 });
  }
}
