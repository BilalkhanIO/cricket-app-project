import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { inningsId, overNumber, bowlerId } = await req.json();

    // Mark previous over as completed
    await prisma.over.updateMany({
      where: { inningsId, overNumber: overNumber - 1 },
      data: { isCompleted: true },
    });

    // Create new over
    const over = await prisma.over.create({
      data: { inningsId, overNumber, bowlerId },
    });

    return NextResponse.json({ over }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to start over" }, { status: 500 });
  }
}
