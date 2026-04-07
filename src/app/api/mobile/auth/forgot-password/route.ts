import { NextRequest } from "next/server";
import crypto from "crypto";

import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return optionsWithCors(req);
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return jsonWithCors(req, { error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isActive: true },
    });

    // Always succeed to prevent email enumeration
    if (!user || !user.isActive) {
      return jsonWithCors(req, { success: true });
    }

    // Invalidate any existing unused tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    // TODO: Send email — resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

    return jsonWithCors(req, { success: true });
  } catch {
    return jsonWithCors(req, { error: "Request failed" }, { status: 500 });
  }
}
