import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { canAccessAdminArea } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: { _count: { select: { matches: true } } },
    });

    if (!venue) return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    return NextResponse.json({ venue });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch venue" }, { status: 500 });
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
    const venue = await prisma.venue.update({ where: { id }, data });
    return NextResponse.json({ venue });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update venue" }, { status: 500 });
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

    await prisma.venue.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete venue" }, { status: 500 });
  }
}
