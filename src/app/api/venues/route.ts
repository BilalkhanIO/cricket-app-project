import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canAccessAdminArea } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const venues = await prisma.venue.findMany({
      include: { _count: { select: { matches: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ venues });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch venues" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!canAccessAdminArea(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();
    const venue = await prisma.venue.create({ data });
    return NextResponse.json({ venue }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create venue" }, { status: 500 });
  }
}
