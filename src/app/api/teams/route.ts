import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leagueId = searchParams.get("leagueId");
    const managerId = searchParams.get("managerId");

    const teams = await prisma.team.findMany({
      where: {
        ...(managerId && { managerId }),
        ...(leagueId && {
          leagues: { some: { leagueId, status: "APPROVED" } },
        }),
      },
      include: {
        manager: { select: { name: true, email: true } },
        _count: { select: { players: true } },
        leagues: leagueId
          ? { where: { leagueId }, select: { status: true, group: true } }
          : false,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ teams });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canCreate = ["SUPER_ADMIN", "LEAGUE_ADMIN", "TEAM_MANAGER"].includes(session.user.role);
    if (!canCreate) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const team = await prisma.team.create({
      data: {
        ...data,
        managerId: session.user.id,
      },
    });

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}
