import { NextRequest } from "next/server";

import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
  return optionsWithCors(req);
}

export async function GET(req: NextRequest) {
  try {
    const sessionUser = getMobileUserFromRequest(req);
    if (!sessionUser) {
      return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profileImage: true,
        phone: true,
        city: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });
    }

    return jsonWithCors(req, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.profileImage,
        phone: user.phone,
        city: user.city,
      },
    });
  } catch {
    return jsonWithCors(req, { error: "Failed to fetch mobile user" }, { status: 500 });
  }
}
