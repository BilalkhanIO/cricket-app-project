import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { canEditLeague } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { ROLE } from "@/lib/roles";

export const dynamic = 'force-dynamic';

async function canManageLeague(userId: string, role: string, leagueId: string) {
  if (!canEditLeague(role)) return false;
  if (role === ROLE.SUPER_ADMIN || role === ROLE.LEAGUE_STAFF) return true;
  const league = await prisma.league.findUnique({ where: { id: leagueId }, select: { adminId: true } });
  return !!league && league.adminId === userId;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sponsorId: string }> },
) {
  try {
    const { sponsorId } = await params;
    const sponsor = await prisma.sponsor.findUnique({ where: { id: sponsorId } });
    if (!sponsor) return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    return NextResponse.json({ sponsor });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sponsor" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sponsorId: string }> },
) {
  try {
    const { id, sponsorId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await canManageLeague(session.user.id, session.user.role, id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const sponsor = await prisma.sponsor.update({
      where: { id: sponsorId },
      data,
    });
    return NextResponse.json({ sponsor });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update sponsor" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sponsorId: string }> },
) {
  try {
    const { id, sponsorId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await canManageLeague(session.user.id, session.user.role, id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.sponsor.delete({ where: { id: sponsorId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete sponsor" }, { status: 500 });
  }
}
