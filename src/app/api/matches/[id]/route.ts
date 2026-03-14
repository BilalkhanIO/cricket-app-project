import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const match = await prisma.match.findUnique({
      where: { id: id },
      include: {
        league: { select: { id: true, name: true, oversPerInnings: true } },
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            jerseyColor: true,
            players: {
              where: { isActive: true },
              select: {
                id: true,
                isCaptain: true,
                isWicketkeeper: true,
                user: { select: { name: true, profileImage: true } },
              },
            },
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            jerseyColor: true,
            players: {
              where: { isActive: true },
              select: {
                id: true,
                isCaptain: true,
                isWicketkeeper: true,
                user: { select: { name: true, profileImage: true } },
              },
            },
          },
        },
        venue: true,
        scorer: { select: { name: true } },
        officials: true,
        interruptions: {
          orderBy: { createdAt: "desc" },
        },
        dlsRevisions: {
          orderBy: { createdAt: "desc" },
        },
        playingXIs: {
          include: {
            player: {
              include: {
                user: { select: { name: true, profileImage: true } },
              },
            },
          },
        },
        innings: {
          include: {
            team: { select: { id: true, name: true, shortName: true } },
            battingScores: {
              include: {
                player: { include: { user: { select: { name: true } } } },
              },
              orderBy: { battingOrder: "asc" },
            },
            bowlingScores: {
              include: {
                player: { include: { user: { select: { name: true } } } },
              },
            },
            overs: {
              orderBy: { overNumber: "asc" },
              include: {
                balls: { orderBy: { ballNumber: "asc" } },
              },
            },
          },
          orderBy: { inningsNumber: "asc" },
        },
      },
    });

    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    return NextResponse.json({ match });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch match" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = ["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(session.user.role);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const currentMatch = await prisma.match.findUnique({ where: { id } });
    if (!currentMatch) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    const data = await req.json();
    const nextMatchDate = data.matchDate ? new Date(data.matchDate) : currentMatch.matchDate;
    const nextHomeTeamId = data.homeTeamId || currentMatch.homeTeamId;
    const nextAwayTeamId = data.awayTeamId || currentMatch.awayTeamId;
    const nextVenueId = data.venueId === undefined ? currentMatch.venueId : data.venueId;

    if (Number.isNaN(nextMatchDate.getTime())) {
      return NextResponse.json({ error: "Invalid match date" }, { status: 400 });
    }
    if (nextHomeTeamId === nextAwayTeamId) {
      return NextResponse.json({ error: "A team cannot play against itself" }, { status: 400 });
    }

    const [teamConflict, venueConflict] = await Promise.all([
      prisma.match.findFirst({
        where: {
          id: { not: id },
          matchDate: nextMatchDate,
          status: { notIn: ["CANCELED", "COMPLETED"] },
          OR: [
            { homeTeamId: nextHomeTeamId },
            { awayTeamId: nextHomeTeamId },
            { homeTeamId: nextAwayTeamId },
            { awayTeamId: nextAwayTeamId },
          ],
        },
        select: { id: true },
      }),
      nextVenueId
        ? prisma.match.findFirst({
            where: {
              id: { not: id },
              matchDate: nextMatchDate,
              venueId: nextVenueId,
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

    const updated = await prisma.match.update({
      where: { id: id },
      data: {
        ...data,
        ...(data.matchDate && { matchDate: nextMatchDate }),
      },
      include: {
        homeTeam: { select: { shortName: true } },
        awayTeam: { select: { shortName: true } },
      },
    });

    // Notify newly assigned scorer
    if (data.scorerId && data.scorerId !== currentMatch.scorerId) {
      await prisma.notification.create({
        data: {
          userId: data.scorerId,
          matchId: id,
          type: "MATCH_REMINDER",
          title: "You have been assigned as scorer",
          message: `You are the scorer for ${(updated as any).homeTeam.shortName} vs ${(updated as any).awayTeam.shortName} on ${updated.matchDate.toLocaleDateString("en-GB")}.`,
        },
      }).catch(() => {}); // non-fatal
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        matchId: id,
        action: "UPDATE",
        entity: "Match",
        entityId: id,
        newValue: JSON.stringify(data),
      },
    });

    return NextResponse.json({ match: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update match" }, { status: 500 });
  }
}
