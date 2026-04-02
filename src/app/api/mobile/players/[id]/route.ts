import { NextRequest } from "next/server";

import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;

        const player = await prisma.player.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        profileImage: true,
                        city: true,
                        dateOfBirth: true,
                    },
                },
                team: {
                    select: {
                        id: true,
                        name: true,
                        shortName: true,
                        logo: true,
                    },
                },
                playerStats: {
                    orderBy: { matchesPlayed: "desc" },
                },
                awards: {
                    include: {
                        league: { select: { name: true } },
                        match: {
                            select: {
                                title: true,
                                matchDate: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        });

        if (!player) {
            return jsonWithCors(req, { error: "Player not found" }, { status: 404 });
        }

        return jsonWithCors(req, { player });
    } catch {
        return jsonWithCors(req, { error: "Failed to fetch player" }, { status: 500 });
    }
}
