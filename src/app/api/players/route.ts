import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");
    const search = searchParams.get("search");

    const players = await prisma.player.findMany({
      where: {
        ...(teamId && { teamId }),
        ...(search && {
          user: { name: { contains: search } },
        }),
      },
      include: {
        user: { select: { id: true, name: true, email: true, profileImage: true, city: true } },
        team: { select: { id: true, name: true, shortName: true, logo: true } },
        playerStats: { where: { leagueId: OVERALL_LEAGUE_KEY }, take: 1 },
      },
      orderBy: { user: { name: "asc" } },
    });

    return NextResponse.json({ players });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const player = await prisma.player.create({
      data: {
        userId: data.userId || session.user.id,
        teamId: data.teamId || null,
        photoUrl: data.photoUrl || null,
        jerseyNumber: data.jerseyNumber,
        role: data.role || "BATSMAN",
        battingHand: data.battingHand || "RIGHT",
        bowlingType: data.bowlingType,
        age: data.age,
        medicalStatus: data.medicalStatus || null,
        availabilityStatus: data.availabilityStatus || "AVAILABLE",
        idProofUrl: data.idProofUrl || null,
        fitnessUpdatedAt: data.fitnessUpdatedAt ? new Date(data.fitnessUpdatedAt) : null,
        isCaptain: data.isCaptain || false,
        isViceCaptain: data.isViceCaptain || false,
        isWicketkeeper: data.isWicketkeeper || false,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ player }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
  }
}
