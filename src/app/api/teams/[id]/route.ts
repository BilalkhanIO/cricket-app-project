import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export function OPTIONS(req: NextRequest) {
  return optionsWithCors(req);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const team = await prisma.team.findUnique({
      where: { id: id },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        players: {
          include: {
            user: { select: { id: true, name: true, email: true, profileImage: true } },
            playerStats: { take: 1 },
          },
        },
        leagues: {
          include: { league: { select: { id: true, name: true, season: true, status: true } } },
        },
        pointsTables: {
          include: { league: { select: { name: true } } },
        },
      },
    });

    if (!team) return jsonWithCors(req, { error: "Team not found" }, { status: 404 });
    return jsonWithCors(req, { team });
  } catch (error) {
    return jsonWithCors(req, { error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const team = await prisma.team.findUnique({ where: { id: id } });
    if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const canEdit =
      session.user.role === "SUPER_ADMIN" ||
      session.user.role === "LEAGUE_ADMIN" ||
      team.managerId === session.user.id;
    if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const updated = await prisma.team.update({ where: { id: id }, data });
    return NextResponse.json({ team: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const canDelete =
      session.user.role === "SUPER_ADMIN" ||
      session.user.role === "LEAGUE_ADMIN" ||
      team.managerId === session.user.id;
    if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.team.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}
