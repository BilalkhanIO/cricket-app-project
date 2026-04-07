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
        const venue = await prisma.venue.findUnique({
            where: { id },
            include: {
                matches: {
                    take: 10,
                    orderBy: { matchDate: 'desc' },
                    include: {
                        homeTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
                        awayTeam: { select: { id: true, name: true, shortName: true, logo: true, jerseyColor: true } },
                        venue: { select: { name: true, city: true } },
                        league: { select: { id: true, name: true } },
                        innings: {
                            select: { inningsNumber: true, teamId: true, totalRuns: true, totalWickets: true, totalOvers: true, isCompleted: true },
                        },
                    },
                },
                _count: { select: { matches: true } },
            },
        });

        if (!venue) return jsonWithCors(req, { error: 'Venue not found' }, { status: 404 });
        return jsonWithCors(req, { venue });
    } catch (error: any) {
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

        const updated = await prisma.venue.update({
            where: { id },
            data: {
                name: data.name,
                city: data.city,
                address: data.address,
                googleMapsUrl: data.googleMapsUrl,
                pitchType: data.pitchType,
                boundarySize: data.boundarySize,
                facilities: data.facilities,
            },
        });

        return jsonWithCors(req, { success: true, venue: updated });
    } catch (error: any) {
        console.error('Update Venue Error:', error);
        return jsonWithCors(req, { error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
