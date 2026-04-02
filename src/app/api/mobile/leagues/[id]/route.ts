import { NextRequest } from "next/server";

import { jsonWithCors, optionsWithCors } from "@/lib/api-cors";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getFormGuide(teamId: string, matches: any[]) {
  const completedMatches = matches
    .filter((match) => match.status === "COMPLETED" && (match.homeTeamId === teamId || match.awayTeamId === teamId))
    .slice(-5);

  return completedMatches.map((match) => {
    if (!match.winnerTeamId) return "T";
    return match.winnerTeamId === teamId ? "W" : "L";
  });
}

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;

        const league = await prisma.league.findUnique({
            where: { id },
            include: {
                admin: { select: { name: true } },
                parentLeague: { select: { id: true, name: true } },
                teams: {
                    include: {
                        team: {
                            select: {
                                id: true,
                                name: true,
                                shortName: true,
                                logo: true,
                                jerseyColor: true,
                                city: true,
                                manager: { select: { name: true } },
                                _count: { select: { players: true } },
                            },
                        },
                    },
                    where: { status: "APPROVED" },
                },
                matches: {
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
                    orderBy: { matchDate: "asc" },
                },
                pointsTable: {
                    include: {
                        team: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
                    },
                    orderBy: [{ points: "desc" }, { netRunRate: "desc" }],
                },
                announcements: {
                    where: { isPublic: true },
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
                sponsors: {
                    orderBy: [{ tier: "asc" }, { name: "asc" }],
                },
                awards: {
                    include: {
                        player: {
                            include: {
                                user: { select: { name: true } },
                                team: { select: { name: true, shortName: true, jerseyColor: true } },
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
                _count: {
                    select: {
                        teams: true,
                        matches: true,
                        announcements: true,
                        awards: true,
                        media: true,
                        sponsors: true,
                    },
                },
            },
        });

        if (!league) {
            return jsonWithCors(req, { error: "League not found" }, { status: 404 });
        }

        const enrichedPointsTable = league.pointsTable.map((row) => ({
            ...row,
            formGuide: getFormGuide(row.teamId, league.matches as any[]),
        }));

        return jsonWithCors(req, { 
            league: {
                ...league,
                pointsTable: enrichedPointsTable
            } 
        });
    } catch {
        return jsonWithCors(req, { error: "Failed to fetch league" }, { status: 500 });
    }
}
