import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { canEditLeague } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { ROLE, normalizeRole } from "@/lib/roles";

export const dynamic = 'force-dynamic';

async function canManageLeague(userId: string, role: string, leagueId: string) {
  const normalizedRole = normalizeRole(role);
  if (!canEditLeague(normalizedRole)) return false;
  if (normalizedRole === ROLE.SUPER_ADMIN) return true;
  const league = await prisma.league.findUnique({ where: { id: leagueId }, select: { adminId: true } });
  return !!league && league.adminId === userId;
}

async function resolveAwardData(data: any) {
  let userId = data.userId;
  if (data.playerId) {
    const player = await prisma.player.findUnique({
      where: { id: data.playerId },
      select: { userId: true },
    });
    userId = player?.userId || null;
  }

  return {
    awardType: data.awardType,
    playerId: data.playerId || null,
    userId: userId || null,
    matchId: data.matchId || null,
    description: data.description || null,
    isAutoCalc: data.isAutoCalc ?? false,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; awardId: string }> },
) {
  try {
    const { awardId } = await params;
    const award = await prisma.award.findUnique({
      where: { id: awardId },
      include: {
        player: { include: { user: { select: { name: true } } } },
        awardedTo: { select: { id: true, name: true } },
      },
    });
    if (!award) return NextResponse.json({ error: "Award not found" }, { status: 404 });
    return NextResponse.json({ award });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch award" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; awardId: string }> },
) {
  try {
    const { id, awardId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await canManageLeague(session.user.id, session.user.role, id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const award = await prisma.award.update({
      where: { id: awardId },
      data: await resolveAwardData(data),
      include: {
        player: { include: { user: { select: { name: true } } } },
      },
    });
    return NextResponse.json({ award });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update award" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; awardId: string }> },
) {
  try {
    const { id, awardId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await canManageLeague(session.user.id, session.user.role, id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.award.delete({ where: { id: awardId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete award" }, { status: 500 });
  }
}
