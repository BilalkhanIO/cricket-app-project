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
        const leagueId = searchParams.get("leagueId");
        const limit = Math.min(Number(searchParams.get("limit") || 20), 50);

        if (type === "bowling") {
            const bowlers = await prisma.playerStats.findMany({
                where: {
                    wickets: { gt: 0 },
                    ...(leagueId && { leagueId }),
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
            where: {
                runs: { gt: 0 },
                ...(leagueId && { leagueId }),
            },
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
