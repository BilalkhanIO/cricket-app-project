import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

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
    const matchDate = new Date(data.matchDate);
    if (Number.isNaN(matchDate.getTime())) {
      return NextResponse.json({ error: "Invalid match date" }, { status: 400 });
    }
    if (data.homeTeamId === data.awayTeamId) {
      return NextResponse.json({ error: "A team cannot play against itself" }, { status: 400 });
    }

    const [teamConflict, venueConflict] = await Promise.all([
      prisma.match.findFirst({
        where: {
          matchDate,
          status: { notIn: ["CANCELED", "COMPLETED"] },
          OR: [
            { homeTeamId: data.homeTeamId },
            { awayTeamId: data.homeTeamId },
            { homeTeamId: data.awayTeamId },
            { awayTeamId: data.awayTeamId },
          ],
        },
        select: { id: true },
      }),
      data.venueId
        ? prisma.match.findFirst({
            where: {
              matchDate,
              venueId: data.venueId,
              status: { notIn: ["CANCELED", "COMPLETED"] },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (teamConflict) {
      return NextResponse.json(
        { error: "Fixture conflict: one team is already scheduled at this time" },
        { status: 400 }
      );
    }
    if (venueConflict) {
      return NextResponse.json(
        { error: "Fixture conflict: venue is already occupied at this time" },
        { status: 400 }
      );
    }

    const match = await prisma.match.create({
      data: {
        ...data,
        matchDate,
      },
      include: {
        homeTeam: { select: { shortName: true } },
        awayTeam: { select: { shortName: true } },
      },
    });

    // Notify assigned scorer
    if (data.scorerId) {
      await prisma.notification.create({
        data: {
          userId: data.scorerId,
          matchId: match.id,
          type: "MATCH_REMINDER",
          title: "You have been assigned as scorer",
          message: `You are the scorer for ${(match as any).homeTeam.shortName} vs ${(match as any).awayTeam.shortName} on ${match.matchDate.toLocaleDateString("en-GB")}.`,
        },
      }).catch(() => {}); // non-fatal
    }

    return NextResponse.json({ match }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }
}
