import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { canAccessAdminArea } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        league: { select: { id: true, name: true } },
      },
    });

    if (!announcement) return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    return NextResponse.json({ announcement });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch announcement" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canAccessAdminArea(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const announcement = await prisma.announcement.update({ where: { id }, data });
    return NextResponse.json({ announcement });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canAccessAdminArea(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}
