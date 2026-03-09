import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const player = await prisma.player.findUnique({
      where: { id: id },
      include: {
        user: { select: { id: true, name: true, email: true, profileImage: true, city: true, dateOfBirth: true } },
        team: { select: { id: true, name: true, shortName: true, logo: true } },
        playerStats: {
          include: { player: false },
        },
        battingScores: {
          include: {
            innings: {
              include: {
                match: {
                  include: {
                    homeTeam: { select: { name: true } },
                    awayTeam: { select: { name: true } },
                    league: { select: { name: true } },
                  },
                },
              },
            },
          },
          orderBy: { innings: { match: { matchDate: "desc" } } },
          take: 10,
        },
        bowlingScores: {
          include: {
            innings: {
              include: {
                match: {
                  include: {
                    homeTeam: { select: { name: true } },
                    awayTeam: { select: { name: true } },
                  },
                },
              },
            },
          },
          orderBy: { innings: { match: { matchDate: "desc" } } },
          take: 10,
        },
      },
    });

    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });
    return NextResponse.json({ player });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch player" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const player = await prisma.player.findUnique({
      where: { id: id },
      include: { user: true },
    });
    if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const canEdit =
      session.user.role === "SUPER_ADMIN" ||
      session.user.role === "LEAGUE_ADMIN" ||
      player.user.id === session.user.id;
    if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const updated = await prisma.player.update({ where: { id: id }, data });
    return NextResponse.json({ player: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 });
  }
}
