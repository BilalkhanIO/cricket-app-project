import { NextRequest } from "next/server";

import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");

        const leagues = await prisma.league.findMany({
            where: {
                ...(status && { status }),
                ...(search && { name: { contains: search, mode: "insensitive" as const } }),
            },
            include: {
                admin: { select: { name: true } },
                _count: { select: { teams: true, matches: true } },
            },
            orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        });

        return jsonWithCors(req, { leagues });
    } catch {
        return jsonWithCors(req, { error: "Failed to fetch leagues" }, { status: 500 });
    }
}
