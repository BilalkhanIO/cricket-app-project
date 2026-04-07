import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canManageMatchOfficials } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const officials = await prisma.matchOfficial.findMany({
      where: { matchId: id },
      include: {
        user: { select: { id: true, name: true, email: true, profileImage: true } },
      },
    });
    return NextResponse.json({ officials });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch officials" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!canManageMatchOfficials(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, role, userId } = await req.json();

    if (!name || !role) {
      return NextResponse.json({ error: "Name and role are required" }, { status: 400 });
    }

    // If userId provided, validate the user exists
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
      if (!user) return NextResponse.json({ error: "Linked user not found" }, { status: 400 });
    }

    const official = await prisma.matchOfficial.create({
      data: {
        matchId: id,
        name,
        role,
        ...(userId ? { userId } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true, profileImage: true } },
      },
    });

    return NextResponse.json({ official }, { status: 201 });
  } catch (error) {
    console.error("Official creation error:", error);
    return NextResponse.json({ error: "Failed to add official" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!canManageMatchOfficials(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { officialId } = await req.json();
    if (!officialId) return NextResponse.json({ error: "officialId is required" }, { status: 400 });

    await prisma.matchOfficial.delete({ where: { id: officialId, matchId: id } });
    return NextResponse.json({ message: "Official removed" });
  } catch (error) {
    console.error("Official deletion error:", error);
    return NextResponse.json({ error: "Failed to remove official" }, { status: 500 });
  }
}
