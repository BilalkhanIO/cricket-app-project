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

    const { teamId, inningsNumber, targetRuns } = await req.json();

    const innings = await prisma.innings.create({
      data: {
        matchId: id,
        teamId,
        inningsNumber,
        targetRuns: targetRuns || null,
      },
    });

    // Update match status to LIVE
    await prisma.match.update({
      where: { id: id },
      data: { status: inningsNumber === 1 ? "LIVE" : "INNINGS_BREAK" },
    });

    return NextResponse.json({ innings }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to start innings" }, { status: 500 });
  }
}
