import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { players, teamId } = await req.json();

    // Delete existing playing XI for this team
    await prisma.playingXI.deleteMany({
      where: { matchId: id, teamId },
    });

    // Create new playing XI
    const playingXI = await prisma.playingXI.createMany({
      data: players.map((p: { playerId: string; battingOrder: number; isSubstitute: boolean }) => ({
        matchId: id,
        playerId: p.playerId,
        teamId,
        battingOrder: p.battingOrder,
        isSubstitute: p.isSubstitute || false,
      })),
    });

    return NextResponse.json({ playingXI });
  } catch (error) {
    return NextResponse.json({ error: "Failed to set playing XI" }, { status: 500 });
  }
}
