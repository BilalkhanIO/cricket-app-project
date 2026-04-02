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
        const search = searchParams.get("search") || "";

        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { shortName: { contains: search, mode: "insensitive" } },
                { city: { contains: search, mode: "insensitive" } },
            ];
        }

        const teams = await prisma.team.findMany({
            where,
            include: {
                manager: { select: { name: true } },
                _count: { select: { players: true } },
                leagues: {
                    include: {
                        league: { select: { id: true, name: true, status: true } },
                    },
                    take: 3,
                },
            },
            orderBy: { name: "asc" },
            take: 60,
        });

        return jsonWithCors(req, { teams });
    } catch {
        return jsonWithCors(req, { error: "Failed to fetch teams" }, { status: 500 });
    }
}
