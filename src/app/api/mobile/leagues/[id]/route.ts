import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMobileUserFromRequest } from '@/lib/mobile-auth';
import { isLeagueOpsRole } from '@/lib/roles';
import { jsonWithCors, optionsWithCors } from '@/lib/api-cors';

const matchInclude = {
    homeTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
    awayTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
    venue: { select: { name: true, city: true } },
    league: { select: { id: true, name: true } },
    innings: {
        select: { inningsNumber: true, teamId: true, totalRuns: true, totalWickets: true, totalOvers: true, isCompleted: true },
    },
} as const;

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const league = await prisma.league.findUnique({
            where: { id },
            include: {
                admin: { select: { id: true, name: true } },
                parentLeague: { select: { name: true } },
                sponsors: { select: { id: true, name: true, tier: true } },
                matches: {
                    include: matchInclude,
                    orderBy: { matchDate: 'asc' },
                },
                teams: {
                    include: {
                        team: {
                            include: {
                                manager: { select: { name: true } },
                                _count: { select: { players: true } },
                            },
                        },
                    },
                },
                pointsTable: {
                    include: {
                        team: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
                    },
                    orderBy: [{ points: 'desc' }, { netRunRate: 'desc' }],
                },
                announcements: {
                    select: { id: true, title: true, content: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                awards: {
                    include: {
                        player: {
                            include: {
                                user: { select: { name: true } },
                                team: { select: { name: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!league) return jsonWithCors(req, { error: 'League not found' }, { status: 404 });

        // Map DB fields to frontend-expected shape and compute qualificationStatus per group
        const groupRanks: Record<string, number> = {};
        const pointsTableMapped = league.pointsTable.map((entry) => {
            const group = entry.group || 'Overall';
            groupRanks[group] = (groupRanks[group] || 0) + 1;
            const rank = groupRanks[group];
            return {
                ...entry,
                groupName: group,
                qualificationStatus: rank <= 2 ? 'Qualified' : 'Chasing',
                formGuide: [] as string[],
            };
        });

        const teamsMapped = league.teams.map((t) => ({ ...t, group: t.group ?? null }));

        return jsonWithCors(req, {
            league: {
                ...league,
                teams: teamsMapped,
                pointsTable: pointsTableMapped,
            },
        });
    } catch (error: any) {
        console.error('League Detail Error:', error);
        return jsonWithCors(req, { error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getMobileUserFromRequest(req);
        if (!user || !isLeagueOpsRole(user.role)) {
            return jsonWithCors(req, { error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const data = await req.json();

        const updated = await prisma.league.update({
            where: { id },
            data: {
                name: data.name,
                season: data.season,
                year: data.year ? parseInt(data.year) : undefined,
                status: data.status,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                description: data.description,
                matchFormat: data.matchFormat,
                oversPerInnings: data.oversPerInnings ? parseInt(data.oversPerInnings) : undefined,
            },
        });

        return jsonWithCors(req, { success: true, league: updated });
    } catch (error: any) {
        console.error('Update League Error:', error);
        return jsonWithCors(req, { error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
