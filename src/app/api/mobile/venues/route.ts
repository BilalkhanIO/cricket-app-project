import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMobileUserFromRequest } from '@/lib/mobile-auth';
import { isLeagueOpsRole } from '@/lib/roles';
import { jsonWithCors, optionsWithCors } from '@/lib/api-cors';

export function OPTIONS(req: NextRequest) {
    return optionsWithCors(req);
}

export async function GET(req: NextRequest) {
    try {
        const venues = await prisma.venue.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { matches: true } },
            },
        });
        return jsonWithCors(req, { venues });
    } catch (error: any) {
        return jsonWithCors(req, { error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getMobileUserFromRequest(req);
        if (!user || !isLeagueOpsRole(user.role)) {
            return jsonWithCors(req, { error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const venue = await prisma.venue.create({
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

        return jsonWithCors(req, { success: true, venue });
    } catch (error: any) {
        console.error('Create Venue Error:', error);
        return jsonWithCors(req, { error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
