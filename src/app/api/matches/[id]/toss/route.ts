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

    const { tossWinnerId, tossDecision } = await req.json();

    const match = await prisma.match.update({
      where: { id: id },
      data: {
        tossWinnerId,
        tossDecision,
        status: "TOSS",
      },
    });

    return NextResponse.json({ match });
  } catch (error) {
    return NextResponse.json({ error: "Failed to record toss" }, { status: 500 });
  }
}
