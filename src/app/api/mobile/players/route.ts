import { NextRequest } from "next/server";

import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const teamId = searchParams.get("teamId");
        const search = searchParams.get("search");

        const players = await prisma.player.findMany({
            where: {
                ...(teamId && { teamId }),
                ...(search && {
                    user: {
                        name: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true,
                        city: true,
                    },
                },
                team: { select: { id: true, name: true, shortName: true, logo: true } },
                playerStats: {
                    where: { leagueId: OVERALL_LEAGUE_KEY },
                    take: 1,
                },
            },
            orderBy: { user: { name: "asc" } },
        });

        return jsonWithCors(req, { players });
    } catch {
        return jsonWithCors(req, { error: "Failed to fetch players" }, { status: 500 });
    }
}
