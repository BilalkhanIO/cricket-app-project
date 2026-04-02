import { NextRequest } from "next/server";

import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import { OVERALL_LEAGUE_KEY } from "@/lib/constants";
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

        const team = await prisma.team.findUnique({
            where: { id },
            include: {
                manager: { select: { name: true, profileImage: true } },
                players: {
                    include: {
                        user: { select: { name: true, profileImage: true, city: true } },
                        playerStats: {
                            where: { leagueId: OVERALL_LEAGUE_KEY },
                            take: 1
                        },
                    },
                },
                leagues: {
                    where: { status: "APPROVED" },
                    include: {
                        league: {
                            select: {
                                id: true,
                                name: true,
                                season: true,
                                status: true,
                                matchFormat: true,
                                _count: { select: { teams: true, matches: true } }
                            }
                        }
                    },
                },
                homeMatches: {
                    where: { status: "COMPLETED" },
                    orderBy: { matchDate: "desc" },
                    take: 5,
                    include: {
                        homeTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
                        awayTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
                        league: { select: { id: true, name: true } },
                        venue: { select: { name: true, city: true } },
                        innings: {
                            select: {
                                id: true,
                                inningsNumber: true,
                                teamId: true,
                                totalRuns: true,
                                totalWickets: true,
                                totalBalls: true,
                                totalOvers: true,
                                isCompleted: true,
                            }
                        }
                    }
                },
                awayMatches: {
                    where: { status: "COMPLETED" },
                    orderBy: { matchDate: "desc" },
                    take: 5,
                    include: {
                        homeTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
                        awayTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
                        league: { select: { id: true, name: true } },
                        venue: { select: { name: true, city: true } },
                        innings: {
                            select: {
                                id: true,
                                inningsNumber: true,
                                teamId: true,
                                totalRuns: true,
                                totalWickets: true,
                                totalBalls: true,
                                totalOvers: true,
                                isCompleted: true,
                            }
                        }
                    }
                }
            },
        });

        if (!team) {
            return jsonWithCors(req, { error: "Team not found" }, { status: 404 });
        }

        return jsonWithCors(req, { team });
    } catch {
        return jsonWithCors(req, { error: "Failed to fetch team" }, { status: 500 });
    }
}
