import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ROLE } from "@/lib/roles";

export const dynamic = "force-dynamic";

const SUPER_ADMIN_ASSIGNABLE_ROLES = new Set(Object.values(ROLE));
const LEAGUE_ADMIN_ASSIGNABLE_ROLES = new Set([
  ROLE.FAN,
  ROLE.PLAYER,
  ROLE.TEAM_OWNER,
  ROLE.TEAM_MANAGER,
  ROLE.COACH,
  ROLE.SELECTOR,
  ROLE.ANALYST,
  ROLE.SCORER,
  ROLE.UMPIRE,
  ROLE.MATCH_REFEREE,
  ROLE.LEAGUE_STAFF,
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const isSuperAdmin = session.user.role === ROLE.SUPER_ADMIN;
    const isLeagueAdmin = session.user.role === ROLE.LEAGUE_ADMIN;
    if (!isSuperAdmin && !isLeagueAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { role, isActive, isVerified } = await req.json();
    const data: Record<string, unknown> = {};
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (isLeagueAdmin && targetUser.role === ROLE.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (role !== undefined) {
      const allowedRoles = isSuperAdmin ? SUPER_ADMIN_ASSIGNABLE_ROLES : LEAGUE_ADMIN_ASSIGNABLE_ROLES;
      if (!allowedRoles.has(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      if (isLeagueAdmin && targetUser.role === ROLE.LEAGUE_ADMIN && role !== ROLE.LEAGUE_ADMIN) {
        return NextResponse.json({ error: "League admins cannot demote other league admins" }, { status: 403 });
      }
      data.role = role;
    }

    if (isActive !== undefined) {
      if (isLeagueAdmin && [ROLE.LEAGUE_ADMIN, ROLE.SUPER_ADMIN].includes(targetUser.role)) {
        return NextResponse.json({ error: "League admins cannot change admin account status" }, { status: 403 });
      }
      data.isActive = Boolean(isActive);
    }

    if (isVerified !== undefined) {
      if (isLeagueAdmin && [ROLE.LEAGUE_ADMIN, ROLE.SUPER_ADMIN].includes(targetUser.role)) {
        return NextResponse.json({ error: "League admins cannot change admin verification" }, { status: 403 });
      }
      data.isVerified = Boolean(isVerified);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        city: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user access" }, { status: 500 });
  }
}
