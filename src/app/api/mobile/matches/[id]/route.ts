import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMobileUserFromRequest } from '@/lib/mobile-auth';
import { isLeagueOpsRole } from '@/lib/roles';
import { jsonWithCors, optionsWithCors } from '@/lib/api-cors';

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const match = await prisma.match.findUnique({
            where: { id },
            include: {
                homeTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
                awayTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
                venue: { select: { id: true, name: true, city: true } },
                league: { select: { id: true, name: true } },
                scorer: { select: { id: true, name: true } },
                officials: {
                    select: { id: true, name: true, role: true, userId: true },
                },
                playingXIs: {
                    include: {
                        player: {
                            include: {
                                user: { select: { name: true, profileImage: true } },
                            },
                        },
                    },
                },
                innings: {
                    include: {
                        team: { select: { id: true, name: true, shortName: true } },
                        overs: {
                            include: {
                                balls: {
                                    orderBy: { ballNumber: 'asc' },
                                },
                            },
                            orderBy: { overNumber: 'asc' },
                        },
                        battingScores: {
                            include: {
                                player: { include: { user: { select: { name: true } } } },
                            },
                            orderBy: { battingOrder: 'asc' },
                        },
                        bowlingScores: {
                            include: {
                                player: { include: { user: { select: { name: true } } } },
                            },
                        },
                    },
                    orderBy: { inningsNumber: 'asc' },
                },
            },
        });

        if (!match) return jsonWithCors(req, { error: 'Match not found' }, { status: 404 });

        // Fetch recent ball event audits for edit history
        const ballEventAudits = await prisma.ballEventAudit.findMany({
            where: { matchId: id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return jsonWithCors(req, { match, ballEventAudits });
    } catch (error: any) {
        console.error('Match Detail Error:', error);
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

        const updated = await prisma.match.update({
            where: { id },
            data: {
                matchDate: data.matchDate ? new Date(data.matchDate) : undefined,
                venueId: data.venueId,
                status: data.status,
                matchFormat: data.matchFormat,
                overs: data.overs ? parseInt(data.overs) : undefined,
                tossWinnerId: data.tossWinnerId,
                tossDecision: data.tossDecision,
                result: data.result,
                groupName: data.groupName,
                stage: data.stage,
                scorerId: data.scorerId,
            },
        });

        return jsonWithCors(req, { success: true, match: updated });
    } catch (error: any) {
        console.error('Update Match Error:', error);
        return jsonWithCors(req, { error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
