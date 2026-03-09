import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leagueId = searchParams.get("leagueId");

    const announcements = await prisma.announcement.findMany({
      where: {
        isPublic: true,
        ...(leagueId && { leagueId }),
      },
      include: {
        author: { select: { name: true } },
        league: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canPost = ["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(session.user.role);
    if (!canPost) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const announcement = await prisma.announcement.create({
      data: {
        ...data,
        authorId: session.user.id,
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}
