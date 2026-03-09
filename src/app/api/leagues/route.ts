import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const leagues = await prisma.league.findMany({
      where: {
        ...(status && { status }),
        ...(search && { name: { contains: search } }),
      },
      include: {
        admin: { select: { name: true, email: true } },
        _count: { select: { teams: true, matches: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leagues });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leagues" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canCreate = ["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(session.user.role);
    if (!canCreate) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const league = await prisma.league.create({
      data: {
        ...data,
        adminId: session.user.id,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });

    return NextResponse.json({ league }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create league" }, { status: 500 });
  }
}
