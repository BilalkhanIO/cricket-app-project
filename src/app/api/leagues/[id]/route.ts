import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const league = await prisma.league.findUnique({
      where: { id },
      include: {
        admin: { select: { id: true, name: true, email: true } },
        teams: {
          include: {
            team: {
              include: {
                manager: { select: { name: true } },
                _count: { select: { players: true } },
              },
            },
          },
        },
        matches: {
          include: {
            homeTeam: { select: { id: true, name: true, shortName: true, logo: true } },
            awayTeam: { select: { id: true, name: true, shortName: true, logo: true } },
            venue: { select: { name: true, city: true } },
          },
          orderBy: { matchDate: "asc" },
        },
        pointsTable: {
          include: { team: { select: { id: true, name: true, shortName: true, logo: true } } },
          orderBy: [{ points: "desc" }, { netRunRate: "desc" }],
        },
        announcements: {
          where: { isPublic: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        sponsors: true,
      },
    });

    if (!league) return NextResponse.json({ error: "League not found" }, { status: 404 });
    return NextResponse.json({ league });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch league" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const league = await prisma.league.findUnique({ where: { id } });
    if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const canEdit =
      session.user.role === "SUPER_ADMIN" ||
      (session.user.role === "LEAGUE_ADMIN" && league.adminId === session.user.id);
    if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const updated = await prisma.league.update({
      where: { id },
      data: {
        ...data,
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
      },
    });

    return NextResponse.json({ league: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update league" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.league.update({
      where: { id },
      data: { status: "CANCELED" },
    });

    return NextResponse.json({ message: "League canceled" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete league" }, { status: 500 });
  }
}
