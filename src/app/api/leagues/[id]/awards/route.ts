import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const awards = await prisma.award.findMany({
      where: { leagueId: id },
      include: {
        player: { include: { user: { select: { name: true } } } },
        awardedTo: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ awards });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch awards" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = ["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(session.user.role);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { awardType, playerId, matchId, description } = await req.json();

    if (!awardType) {
      return NextResponse.json({ error: "Award type is required" }, { status: 400 });
    }

    // Get the player's userId if playerId is provided
    let userId: string | undefined;
    if (playerId) {
      const player = await prisma.player.findUnique({
        where: { id: playerId },
        select: { userId: true },
      });
      userId = player?.userId;
    }

    const award = await prisma.award.create({
      data: {
        leagueId: id,
        awardType,
        playerId: playerId || null,
        userId: userId || null,
        matchId: matchId || null,
        description: description || null,
      },
      include: {
        player: { include: { user: { select: { name: true } } } },
      },
    });

    return NextResponse.json({ award }, { status: 201 });
  } catch (error) {
    console.error("Award creation error:", error);
    return NextResponse.json({ error: "Failed to create award" }, { status: 500 });
  }
}
