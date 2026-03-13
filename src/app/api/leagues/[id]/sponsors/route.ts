import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sponsors = await prisma.sponsor.findMany({
      where: { leagueId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ sponsors });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sponsors" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = ["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(session.user.role);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name, logo, website, tier } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Sponsor name is required" }, { status: 400 });
    }

    const sponsor = await prisma.sponsor.create({
      data: {
        leagueId: id,
        name,
        logo: logo || null,
        website: website || null,
        tier: tier || "SILVER",
      },
    });

    return NextResponse.json({ sponsor }, { status: 201 });
  } catch (error) {
    console.error("Sponsor creation error:", error);
    return NextResponse.json({ error: "Failed to create sponsor" }, { status: 500 });
  }
}
