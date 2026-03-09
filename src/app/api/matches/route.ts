import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leagueId = searchParams.get("leagueId");
    const status = searchParams.get("status");
    const teamId = searchParams.get("teamId");

    const matches = await prisma.match.findMany({
      where: {
        ...(leagueId && { leagueId }),
        ...(status && { status }),
        ...(teamId && {
          OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        }),
      },
      include: {
        homeTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
        awayTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
        venue: { select: { name: true, city: true } },
        league: { select: { id: true, name: true } },
        innings: {
          select: {
            inningsNumber: true,
            teamId: true,
            totalRuns: true,
            totalWickets: true,
            totalOvers: true,
            isCompleted: true,
          },
        },
      },
      orderBy: { matchDate: "asc" },
    });

    return NextResponse.json({ matches });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canCreate = ["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(session.user.role);
    if (!canCreate) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const match = await prisma.match.create({
      data: {
        ...data,
        matchDate: new Date(data.matchDate),
      },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });

    return NextResponse.json({ match }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }
}
