import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const canRevise = ["SUPER_ADMIN", "LEAGUE_ADMIN", "SCORER"].includes(session.user.role);
    if (!canRevise) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const revisedTarget = Number(body.revisedTarget);
    const inningsNumber = Number(body.inningsNumber || 2);

    if (!Number.isFinite(revisedTarget) || revisedTarget <= 0) {
      return NextResponse.json({ error: "Invalid revised target" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id },
      include: { league: { select: { id: true, dlsEnabled: true } } },
    });
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    if (!match.league.dlsEnabled) {
      return NextResponse.json({ error: "DLS is disabled for this league" }, { status: 400 });
    }

    const revision = await prisma.dlsRevision.create({
      data: {
        matchId: id,
        inningsNumber,
        revisedTarget,
        parScore: body.parScore ?? null,
        resourcesBefore: body.resourcesBefore ?? null,
        resourcesAfter: body.resourcesAfter ?? null,
        note: body.note ?? null,
      },
    });

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        revisedTargetDls: revisedTarget,
        isDlsApplied: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        matchId: id,
        action: "DLS_REVISED",
        entity: "Match",
        entityId: id,
        newValue: JSON.stringify({
          inningsNumber,
          revisedTarget,
          parScore: body.parScore ?? null,
          resourcesBefore: body.resourcesBefore ?? null,
          resourcesAfter: body.resourcesAfter ?? null,
          note: body.note ?? null,
        }),
      },
    });

    return NextResponse.json({ revision, match: updatedMatch }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to revise DLS target" }, { status: 500 });
  }
}
