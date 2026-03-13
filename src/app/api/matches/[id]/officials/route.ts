import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const officials = await prisma.matchOfficial.findMany({
      where: { matchId: id },
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

    const isAdmin = ["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(session.user.role);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name, role } = await req.json();

    if (!name || !role) {
      return NextResponse.json({ error: "Name and role are required" }, { status: 400 });
    }

    const official = await prisma.matchOfficial.create({
      data: {
        matchId: id,
        name,
        role,
      },
    });

    return NextResponse.json({ official }, { status: 201 });
  } catch (error) {
    console.error("Official creation error:", error);
    return NextResponse.json({ error: "Failed to add official" }, { status: 500 });
  }
}
