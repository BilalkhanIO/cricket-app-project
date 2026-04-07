import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { canManageMatchOfficials } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageMatchOfficials(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const roles = searchParams.get("roles");
    const search = searchParams.get("search");
    const take = parseInt(searchParams.get("take") || "50", 10);
    const parsedRoles = roles ? roles.split(",").map((value) => value.trim()).filter(Boolean) : [];

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(role && { role }),
        ...(parsedRoles.length > 0 && { role: { in: parsedRoles } }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      take,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        city: true,
        profileImage: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
