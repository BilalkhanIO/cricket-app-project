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
        const type = searchParams.get("type") || "batting";
        const leagueId = searchParams.get("leagueId") || undefined;
        const limit = Math.min(Number(searchParams.get("limit") || 20), 50);

        const leagueFilter = leagueId ? { leagueId } : {};

        if (type === "sixes") {
            const players = await prisma.playerStats.findMany({
                where: { sixes: { gt: 0 }, ...leagueFilter },
                include: {
                    player: {
                        include: {
                            user: { select: { name: true, profileImage: true } },
                            team: { select: { id: true, name: true, shortName: true, logo: true } },
                        },
                    },
                },
                orderBy: [{ sixes: "desc" }, { runs: "desc" }],
                take: limit,
            });
            return jsonWithCors(req, {
                type: "sixes",
                leaderboard: players.map((s, i) => ({
                    rank: i + 1,
                    playerId: s.playerId,
                    playerName: s.player.user.name,
                    playerImage: s.player.user.profileImage,
                    team: s.player.team,
                    matches: s.matchesPlayed,
                    sixes: s.sixes,
                    runs: s.runs,
                    innings: s.innings,
                })),
            });
        }

        if (type === "average") {
            const players = await prisma.playerStats.findMany({
                where: { innings: { gte: 3 }, average: { gt: 0 }, ...leagueFilter },
                include: {
                    player: {
                        include: {
                            user: { select: { name: true, profileImage: true } },
                            team: { select: { id: true, name: true, shortName: true, logo: true } },
                        },
                    },
                },
                orderBy: [{ average: "desc" }, { runs: "desc" }],
                take: limit,
            });
            return jsonWithCors(req, {
                type: "average",
                leaderboard: players.map((s, i) => ({
                    rank: i + 1,
                    playerId: s.playerId,
                    playerName: s.player.user.name,
                    playerImage: s.player.user.profileImage,
                    team: s.player.team,
                    matches: s.matchesPlayed,
                    innings: s.innings,
                    average: s.average,
                    runs: s.runs,
                    highestScore: s.highestScore,
                })),
            });
        }

        if (type === "strikeRate") {
            const players = await prisma.playerStats.findMany({
                where: { innings: { gte: 3 }, strikeRate: { gt: 0 }, ...leagueFilter },
                include: {
                    player: {
                        include: {
                            user: { select: { name: true, profileImage: true } },
                            team: { select: { id: true, name: true, shortName: true, logo: true } },
                        },
                    },
                },
                orderBy: [{ strikeRate: "desc" }, { runs: "desc" }],
                take: limit,
            });
            return jsonWithCors(req, {
                type: "strikeRate",
                leaderboard: players.map((s, i) => ({
                    rank: i + 1,
                    playerId: s.playerId,
                    playerName: s.player.user.name,
                    playerImage: s.player.user.profileImage,
                    team: s.player.team,
                    matches: s.matchesPlayed,
                    innings: s.innings,
                    strikeRate: s.strikeRate,
                    runs: s.runs,
                })),
            });
        }

        if (type === "economy") {
            const players = await prisma.playerStats.findMany({
                where: { oversBowled: { gt: 2 }, economy: { gt: 0 }, ...leagueFilter },
                include: {
                    player: {
                        include: {
                            user: { select: { name: true, profileImage: true } },
                            team: { select: { id: true, name: true, shortName: true, logo: true } },
                        },
                    },
                },
                orderBy: [{ economy: "asc" }, { wickets: "desc" }],
                take: limit,
            });
            return jsonWithCors(req, {
                type: "economy",
                leaderboard: players.map((s, i) => ({
                    rank: i + 1,
                    playerId: s.playerId,
                    playerName: s.player.user.name,
                    playerImage: s.player.user.profileImage,
                    team: s.player.team,
                    matches: s.matchesPlayed,
                    economy: s.economy,
                    wickets: s.wickets,
                    oversBowled: s.oversBowled,
                })),
            });
        }

        if (type === "bowling") {
            const bowlers = await prisma.playerStats.findMany({
                where: {
                    wickets: { gt: 0 },
                    ...leagueFilter,
                },
                include: {
                    player: {
                        include: {
                            user: { select: { name: true, profileImage: true } },
                            team: { select: { id: true, name: true, shortName: true, logo: true } },
                        },
                    },
                },
                orderBy: [{ wickets: "desc" }, { economy: "asc" }],
                take: limit,
            });

            return jsonWithCors(req, {
                type: "bowling",
                leaderboard: bowlers.map((s, i) => ({
                    rank: i + 1,
                    playerId: s.playerId,
                    playerName: s.player.user.name,
                    playerImage: s.player.user.profileImage,
                    team: s.player.team,
                    matches: s.matchesPlayed,
                    wickets: s.wickets,
                    economy: s.economy,
                    average: s.bowlingAverage,
                    bestBowling: s.bestBowling,
                    oversBowled: s.oversBowled,
                })),
            });
        }

        const batsmen = await prisma.playerStats.findMany({
            where: { runs: { gt: 0 }, ...leagueFilter },
            include: {
                player: {
                    include: {
                        user: { select: { name: true, profileImage: true } },
                        team: { select: { id: true, name: true, shortName: true, logo: true } },
                    },
                },
            },
            orderBy: [{ runs: "desc" }, { strikeRate: "desc" }],
            take: limit,
        });

        return jsonWithCors(req, {
            type: "batting",
            leaderboard: batsmen.map((s, i) => ({
                rank: i + 1,
                playerId: s.playerId,
                playerName: s.player.user.name,
                playerImage: s.player.user.profileImage,
                team: s.player.team,
                matches: s.matchesPlayed,
                innings: s.innings,
                runs: s.runs,
                average: s.average,
                strikeRate: s.strikeRate,
                fifties: s.fifties,
                hundreds: s.hundreds,
                highestScore: s.highestScore,
            })),
        });
    } catch {
        return jsonWithCors(req, { error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}
