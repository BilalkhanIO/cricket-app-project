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
        const status = searchParams.get("status") || "";

        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { homeTeam: { name: { contains: search, mode: "insensitive" } } },
                { homeTeam: { shortName: { contains: search, mode: "insensitive" } } },
                { awayTeam: { name: { contains: search, mode: "insensitive" } } },
                { awayTeam: { shortName: { contains: search, mode: "insensitive" } } },
                { league: { name: { contains: search, mode: "insensitive" } } },
                { venue: { name: { contains: search, mode: "insensitive" } } },
                { venue: { city: { contains: search, mode: "insensitive" } } },
            ];
        }

        const matches = await prisma.match.findMany({
            where,
            include: {
                homeTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
                awayTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
                venue: { select: { name: true, city: true } },
                league: { select: { id: true, name: true } },
                innings: {
                    select: {
                        inningsNumber: true,
                        teamId: true,
                        totalRuns: true,
                        totalWickets: true,
                        totalOvers: true,
                        isCompleted: true,
                    },
                },
            },
            orderBy: [{ matchDate: "desc" }],
            take: 50,
        });

        return jsonWithCors(req, { matches });
    } catch {
        return jsonWithCors(req, { error: "Failed to fetch matches" }, { status: 500 });
    }
}
