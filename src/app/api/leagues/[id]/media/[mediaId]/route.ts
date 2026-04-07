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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> },
) {
  try {
    const { mediaId } = await params;
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });
    return NextResponse.json({ media });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> },
) {
  try {
    const { id, mediaId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await canManageLeague(session.user.id, session.user.role, id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const media = await prisma.media.update({
      where: { id: mediaId },
      data,
    });
    return NextResponse.json({ media });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update media" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> },
) {
  try {
    const { id, mediaId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await canManageLeague(session.user.id, session.user.role, id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.media.delete({ where: { id: mediaId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
  }
}
