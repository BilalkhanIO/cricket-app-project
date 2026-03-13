import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const media = await prisma.media.findMany({
      where: { leagueId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ media });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = ["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(session.user.role);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { url, type, title, description } = await req.json();

    if (!url || !type) {
      return NextResponse.json({ error: "URL and type are required" }, { status: 400 });
    }

    const media = await prisma.media.create({
      data: {
        leagueId: id,
        url,
        type: type || "IMAGE",
        title: title || null,
        description: description || null,
      },
    });

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    console.error("Media creation error:", error);
    return NextResponse.json({ error: "Failed to upload media" }, { status: 500 });
  }
}
