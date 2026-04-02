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

        const match = await prisma.match.findUnique({
            where: { id },
            include: {
                homeTeam: {
                    select: {
                        id: true,
                        name: true,
                        shortName: true,
                        logo: true,
                        jerseyColor: true,
                        players: {
                            include: {
                                user: { select: { name: true, profileImage: true } },
                            },
                            orderBy: [{ isCaptain: "desc" }, { jerseyNumber: "asc" }],
                        },
                    },
                },
                awayTeam: {
                    select: {
                        id: true,
                        name: true,
                        shortName: true,
                        logo: true,
                        jerseyColor: true,
                        players: {
                            include: {
                                user: { select: { name: true, profileImage: true } },
                            },
                            orderBy: [{ isCaptain: "desc" }, { jerseyNumber: "asc" }],
                        },
                    },
                },
                venue: true,
                league: { select: { id: true, name: true, season: true, oversPerInnings: true } },
                scorer: { select: { id: true, name: true } },
                officials: true,
                awards: {
                    where: { awardType: "MAN_OF_MATCH" },
                    include: {
                        player: {
                            include: {
                                user: { select: { name: true } },
                                team: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
                            },
                        },
                    },
                    take: 1,
                },
                innings: {
                    include: {
                        team: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
                        battingScores: {
                            include: {
                                player: {
                                    include: {
                                        user: { select: { name: true } },
                                    },
                                },
                            },
                            orderBy: { battingOrder: "asc" },
                        },
                        bowlingScores: {
                            include: {
                                player: {
                                    include: {
                                        user: { select: { name: true } },
                                    },
                                },
                            },
                            orderBy: [{ wickets: "desc" }, { economy: "asc" }],
                        },
                        overs: {
                            orderBy: { overNumber: "asc" },
                            include: {
                                balls: {
                                    orderBy: { ballNumber: "asc" },
                                },
                            },
                        },
                    },
                    orderBy: { inningsNumber: "asc" },
                },
                playingXIs: {
                    include: {
                        player: {
                            include: {
                                user: { select: { name: true } },
                            },
                        },
                    },
                    orderBy: { battingOrder: "asc" },
                },
            },
        });

        if (!match) {
            return jsonWithCors(req, { error: "Match not found" }, { status: 404 });
        }

        const playerIds = Array.from(
            new Set(
                match.innings.flatMap((innings) =>
                    innings.overs.flatMap((over) =>
                        over.balls.flatMap((ball) => [ball.batsmanId, ball.bowlerId].filter(Boolean)),
                    ),
                ),
            ),
        ) as string[];

        const players = playerIds.length
            ? await prisma.player.findMany({
                  where: { id: { in: playerIds } },
                  include: {
                      user: { select: { name: true } },
                      team: { select: { id: true, name: true, shortName: true, jerseyColor: true } },
                  },
              })
            : [];

        const playerMap = new Map(players.map((player) => [player.id, player]));

        const hydratedMatch = {
            ...match,
            innings: match.innings.map((innings) => ({
                ...innings,
                overs: innings.overs.map((over) => ({
                    ...over,
                    balls: over.balls.map((ball) => ({
                        ...ball,
                        batsman: ball.batsmanId ? playerMap.get(ball.batsmanId) || null : null,
                        bowler: ball.bowlerId ? playerMap.get(ball.bowlerId) || null : null,
                    })),
                })),
            })),
        };

        return jsonWithCors(req, { match: hydratedMatch });
    } catch {
        return jsonWithCors(req, { error: "Failed to fetch match" }, { status: 500 });
    }
}
