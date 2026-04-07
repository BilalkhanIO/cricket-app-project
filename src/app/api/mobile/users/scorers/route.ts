import { NextRequest, NextResponse } from "next/server";
import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function GET(req: NextRequest) {
    try {
        const user = await getMobileUserFromRequest(req);
        if (!user) return jsonWithCors(req, { error: "Unauthorized" }, { status: 401 });

        const scorers = await prisma.user.findMany({
            where: {
                role: { in: ['SCORER', 'ADMIN', 'SUPER_ADMIN'] },
                isActive: true
            },
            select: {
                id: true,
                name: true,
                role: true
            },
            orderBy: { name: 'asc' }
        });

        return jsonWithCors(req, { scorers });
    } catch (error: any) {
        return jsonWithCors(req, { error: error.message || "Failed to fetch scorers" }, { status: 500 });
    }
}
