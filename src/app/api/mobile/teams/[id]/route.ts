import { NextRequest } from 'next/server';
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

        const team = await prisma.team.findUnique({
            where: { id },
            include: {
                manager: { select: { id: true, name: true, profileImage: true } },
                players: {
                    include: {
                        user: { select: { name: true, profileImage: true, city: true } },
                        playerStats: true,
                    },
                    orderBy: { role: 'asc' },
                },
                leagues: {
                    include: {
                        league: {
                            include: {
                                _count: { select: { teams: true, matches: true } },
                            },
                        },
                    },
                },
                homeMatches: {
                    take: 10,
                    orderBy: { matchDate: 'desc' },
                    include: matchInclude,
                },
                awayMatches: {
                    take: 10,
                    orderBy: { matchDate: 'desc' },
                    include: matchInclude,
                },
            },
        });

        if (!team) return jsonWithCors(req, { error: 'Team not found' }, { status: 404 });

        return jsonWithCors(req, { team });
    } catch (error: any) {
        console.error('Team Detail Error:', error);
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

        const updated = await prisma.team.update({
            where: { id },
            data: {
                name: data.name,
                shortName: data.shortName,
                jerseyColor: data.jerseyColor,
                city: data.city,
                description: data.description,
            },
        });

        return jsonWithCors(req, { success: true, team: updated });
    } catch (error: any) {
        console.error('Update Team Error:', error);
        return jsonWithCors(req, { error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
