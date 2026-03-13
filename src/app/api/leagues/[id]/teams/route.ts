import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { teamId, action } = await req.json();

    if (action === "register") {
      const registration = await prisma.teamLeague.upsert({
        where: { teamId_leagueId: { teamId, leagueId: id } },
        update: { status: "PENDING" },
        create: { teamId, leagueId: id, status: "PENDING" },
      });
      return NextResponse.json({ registration });
    }

    if (action === "approve" || action === "reject") {
      const canApprove = ["SUPER_ADMIN", "LEAGUE_ADMIN"].includes(session.user.role);
      if (!canApprove) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const updated = await prisma.teamLeague.update({
        where: { teamId_leagueId: { teamId, leagueId: id } },
        data: { status: action === "approve" ? "APPROVED" : "REJECTED" },
      });

      if (action === "approve") {
        await prisma.pointsTable.upsert({
          where: { leagueId_teamId: { leagueId: id, teamId } },
          update: {},
          create: { leagueId: id, teamId },
        });
      }

      return NextResponse.json({ updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
