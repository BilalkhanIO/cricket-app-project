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

    const canLog = ["SUPER_ADMIN", "LEAGUE_ADMIN", "SCORER"].includes(session.user.role);
    if (!canLog) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const startAt = new Date(body.startAt || new Date());
    const endAt = body.endAt ? new Date(body.endAt) : null;
    const oversLost = Number(body.oversLost || 0);

    if (Number.isNaN(startAt.getTime()) || (endAt && Number.isNaN(endAt.getTime()))) {
      return NextResponse.json({ error: "Invalid interruption dates" }, { status: 400 });
    }

    const interruption = await prisma.matchInterruption.create({
      data: {
        matchId: id,
        startAt,
        endAt,
        reason: body.reason || null,
        oversLost,
        note: body.note || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        matchId: id,
        action: "MATCH_INTERRUPTION",
        entity: "MatchInterruption",
        entityId: interruption.id,
        newValue: JSON.stringify({ startAt, endAt, oversLost, reason: body.reason || null }),
      },
    });

    return NextResponse.json({ interruption }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to log interruption" }, { status: 500 });
  }
}
