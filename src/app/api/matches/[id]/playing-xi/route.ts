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
    if (!teamId || !Array.isArray(players)) {
      return NextResponse.json({ error: "teamId and players are required" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: { select: { id: true, managerId: true } },
        awayTeam: { select: { id: true, managerId: true } },
      },
    });
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    const isParticipatingTeam = teamId === match.homeTeamId || teamId === match.awayTeamId;
    if (!isParticipatingTeam) {
      return NextResponse.json({ error: "Team is not part of this match" }, { status: 400 });
    }

    const isAdmin = ["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(session.user.role);
    const isTeamManager =
      session.user.role === "TEAM_MANAGER" &&
      ((teamId === match.homeTeam.id && match.homeTeam.managerId === session.user.id) ||
        (teamId === match.awayTeam.id && match.awayTeam.managerId === session.user.id));
    if (!isAdmin && !isTeamManager) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const uniquePlayerIds = [...new Set(players.map((p: { playerId: string }) => p.playerId).filter(Boolean))];
    if (uniquePlayerIds.length === 0 || uniquePlayerIds.length > 11) {
      return NextResponse.json({ error: "Playing XI must have 1 to 11 unique players" }, { status: 400 });
    }

    const teamPlayers = await prisma.player.findMany({
      where: { teamId },
      select: { id: true },
    });
    const teamPlayerIds = new Set(teamPlayers.map((p) => p.id));
    if (!uniquePlayerIds.every((pid) => teamPlayerIds.has(pid))) {
      return NextResponse.json(
        { error: "All selected players must belong to the selected team" },
        { status: 400 }
      );
    }

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
