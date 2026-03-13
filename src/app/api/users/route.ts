import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(role && { role }),
      },
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
