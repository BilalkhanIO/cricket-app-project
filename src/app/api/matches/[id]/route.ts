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
        homeTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
        awayTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
        venue: true,
        scorer: { select: { name: true } },
        officials: true,
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

    const data = await req.json();
    const updated = await prisma.match.update({
      where: { id: id },
      data: {
        ...data,
        ...(data.matchDate && { matchDate: new Date(data.matchDate) }),
      },
    });

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
