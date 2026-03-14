import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = ["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(session.user.role);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { scorerId } = await req.json();
    if (!scorerId) return NextResponse.json({ error: "scorerId is required" }, { status: 400 });

    const [match, scorer] = await Promise.all([
      prisma.match.findUnique({ where: { id }, select: { id: true } }),
      prisma.user.findUnique({ where: { id: scorerId }, select: { id: true, role: true, name: true } }),
    ]);

    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    if (!scorer) return NextResponse.json({ error: "Scorer user not found" }, { status: 404 });

    const allowedRoles = ["SCORER", "LEAGUE_ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(scorer.role)) {
      return NextResponse.json({ error: "User does not have scorer permissions" }, { status: 400 });
    }

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: { scorerId },
      select: {
        id: true,
        scorerId: true,
        status: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        matchId: id,
        action: "ASSIGN_SCORER",
        entity: "Match",
        entityId: id,
        newValue: JSON.stringify({ scorerId }),
      },
    });

    return NextResponse.json({ match: updatedMatch, scorer });
  } catch (error) {
    return NextResponse.json({ error: "Failed to assign scorer" }, { status: 500 });
  }
}
